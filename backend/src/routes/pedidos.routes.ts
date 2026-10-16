import { Router } from 'express';
import type { RequestHandler } from 'express';
import pool from '../database';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { IntegracaoErro } from '../integracoes/nuvemshop/config';
import type { PoolClient } from 'pg';

const router = Router();
router.use(authMiddleware);
const wrap = (fn: (req: AuthenticatedRequest, res: import('express').Response) => Promise<void>): RequestHandler =>
  (req, res, next) => { fn(req, res).catch(next); };

const SELECT = `SELECT p.*,p.id AS pedido_id,
  (SELECT count(*)::int FROM ocorrencias o WHERE o.pedido_id=p.id AND o.loja_id=p.loja_id) AS total_ocorrencias,
  COALESCE((SELECT json_agg(json_build_object('id',i.id,'produto',i.produto,'sku',i.sku,'variacao',i.variacao,
    'quantidade',i.quantidade,'valor_unitario',i.valor_unitario) ORDER BY i.id) FROM pedido_itens i WHERE i.pedido_id=p.id),'[]') AS itens
  FROM pedidos p`;

interface Dados { numero: string; clienteNome: string; clienteEmail: string; clienteCpf: string; produto: string;
  tamanho?: string; quantidade: number; valor: number; dataPedido: string; }
function validar(data: unknown): Dados {
  if (!data || typeof data !== 'object') throw new IntegracaoErro('Dados do pedido inválidos.');
  const d = data as Dados;
  const cpf = typeof d.clienteCpf === 'string' ? d.clienteCpf.replace(/\D/g, '') : '';
  const digito = (base: string) => { const resto = base.split('').reduce((s, n, i) => s + Number(n) * (base.length + 1 - i), 0) * 10 % 11; return resto === 10 ? 0 : resto; };
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf) || !cpf.endsWith(`${digito(cpf.slice(0, 9))}${digito(cpf.slice(0, 10))}`)) throw new IntegracaoErro('CPF inválido.');
  if (typeof d.numero !== 'string' || !d.numero.trim() || d.numero.length > 50 ||
      typeof d.clienteNome !== 'string' || !d.clienteNome.trim() || d.clienteNome.length > 100 ||
      typeof d.clienteEmail !== 'string' || d.clienteEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.clienteEmail) ||
      typeof d.produto !== 'string' || !d.produto.trim() || d.produto.length > 255 ||
      !Number.isInteger(d.quantidade) || d.quantidade < 1 || d.quantidade > 100000 ||
      typeof d.valor !== 'number' || !Number.isFinite(d.valor) || d.valor < 0 || d.valor > 99999999.99 ||
      typeof d.dataPedido !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.dataPedido) ||
      !Number.isFinite(Date.parse(d.dataPedido)) || new Date(d.dataPedido).toISOString().slice(0, 10) !== d.dataPedido ||
      d.tamanho !== undefined && (typeof d.tamanho !== 'string' || d.tamanho.length > 100)) throw new IntegracaoErro('Confira número, cliente, produto, quantidade, valor e data do pedido.');
  return { ...d, numero: d.numero.trim().toUpperCase(), clienteCpf: cpf, clienteNome: d.clienteNome.trim(), clienteEmail: d.clienteEmail.trim() };
}

async function salvarManual(client: PoolClient, lojaId: number, d: Dados, atualizar: boolean) {
  // Serializa cadastro/CSV da mesma loja, sem impor unicidade aos pedidos externos.
  await client.query('SELECT pg_advisory_xact_lock(4000,$1)', [lojaId]);
  const existente = await client.query('SELECT id,origem FROM pedidos WHERE loja_id=$1 AND numero_pedido=$2 ORDER BY id', [lojaId, d.numero]);
  if (existente.rowCount && (!atualizar || existente.rows.some(p => p.origem !== 'manual'))) {
    throw new IntegracaoErro('Esse número já existe. Pedidos da Nuvemshop são atualizados pela integração.', 409);
  }
  const values = [d.numero,d.clienteNome,d.clienteCpf,d.clienteEmail,d.produto,d.valor,d.dataPedido,d.quantidade,d.tamanho || null];
  if (existente.rowCount) {
    await client.query(`UPDATE pedidos SET numero_pedido=$1,cliente_nome=$2,cliente_cpf=$3,cliente_email=$4,produto=$5,valor=$6,data_compra=$7,quantidade=$8,tamanho=$9 WHERE id=$10 AND loja_id=$11`, [...values, existente.rows[0].id, lojaId]);
    return { id: existente.rows[0].id, novo: false };
  }
  const r = await client.query(`INSERT INTO pedidos (numero_pedido,cliente_nome,cliente_cpf,cliente_email,produto,valor,data_compra,quantidade,tamanho,loja_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [...values, lojaId]);
  return { id: r.rows[0].id, novo: true };
}

router.get('/', wrap(async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca.slice(0, 100) : '';
  const r = await pool.query(`${SELECT} WHERE p.loja_id=$1 AND ($2='' OR p.numero_pedido ILIKE $3 OR p.cliente_nome ILIKE $3 OR p.cliente_cpf LIKE $3) ORDER BY p.data_compra DESC,p.id DESC`, [req.user!.loja_id, busca, `%${busca}%`]);
  res.json(r.rows);
}));

router.post('/importacoes', wrap(async (req, res) => {
  if (!Array.isArray(req.body?.linhas) || !req.body.linhas.length || req.body.linhas.length > 5000) throw new IntegracaoErro('Envie entre 1 e 5000 linhas por importação.');
  const linhas = req.body.linhas.map(validar);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let novos = 0; let atualizados = 0;
    // Transação única: uma colisão com pedido externo não deixa importação parcial escondida.
    for (const linha of linhas) (await salvarManual(client, req.user!.loja_id, linha, true)).novo ? novos++ : atualizados++;
    await client.query('COMMIT');
    res.json({ novos, atualizados });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

router.post('/', wrap(async (req, res) => {
  const d = validar(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = await salvarManual(client, req.user!.loja_id, d, false);
    const r = await client.query(`${SELECT} WHERE p.loja_id=$1 AND p.id=$2`, [req.user!.loja_id, id]);
    await client.query('COMMIT');
    res.status(201).json(r.rows[0]);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

router.get('/:id', wrap(async (req, res) => {
  if (!/^\d+$/.test(String(req.params.id))) throw new IntegracaoErro('Pedido não encontrado.', 404);
  const r = await pool.query(`${SELECT} WHERE p.loja_id=$1 AND p.id=$2`, [req.user!.loja_id, req.params.id]);
  if (!r.rowCount) throw new IntegracaoErro('Pedido não encontrado.', 404);
  res.json(r.rows[0]);
}));

export default router;
