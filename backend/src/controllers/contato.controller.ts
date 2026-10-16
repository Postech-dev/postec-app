import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import pool from '../database';
import { IntegracaoErro } from '../integracoes/nuvemshop/config';

export async function criarContato(req: AuthenticatedRequest, res: Response) {
  const { pedido_id, motivo, canal, relato, primeira_mensagem } = req.body || {};
  const canais = ['portal', 'telefone', 'instagram', 'loja_fisica', 'reclame_aqui', 'email', 'outro'];
  if (!Number.isSafeInteger(pedido_id) || !canais.includes(canal) ||
      [motivo, relato, primeira_mensagem].some(v => typeof v !== 'string' || !v.trim() || v.length > 2000)) {
    throw new IntegracaoErro('Preencha o pedido, motivo, canal, relato e primeira mensagem.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loja = await client.query('SELECT plano FROM lojas WHERE id=$1', [req.user!.loja_id]);
    if (String(loja.rows[0]?.plano).toLowerCase() !== 'business') throw new IntegracaoErro('Abrir contato pela loja está disponível no plano Business.', 403);
    const pedido = await client.query('SELECT id FROM pedidos WHERE id=$1 AND loja_id=$2', [pedido_id, req.user!.loja_id]);
    if (!pedido.rowCount) throw new IntegracaoErro('Pedido não encontrado.', 404);
    const r = await client.query(`INSERT INTO ocorrencias (loja_id,pedido_id,protocolo,status,motivo,descricao,canal,responsavel)
      VALUES ($1,$2,'POS-'||nextval('ocorrencias_protocolo_seq'),'Em Triagem',$3,$4,$5,$6) RETURNING id,protocolo`,
      [req.user!.loja_id, pedido_id, motivo.trim(), relato.trim(), canal, req.user!.nome]);
    const o = r.rows[0];
    await client.query(`INSERT INTO mensagens (ocorrencia_id,autor,autor_nome,texto,interna) VALUES
      ($1,'sistema','Sistema','Ocorrência aberta pela loja',false),
      ($1,'atendente',$2,$3,true),($1,'atendente',$2,$4,false)`,
      [o.id, req.user!.nome, relato.trim(), primeira_mensagem.trim()]);
    await client.query('COMMIT');
    res.status(201).json({ protocolo: o.protocolo });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
