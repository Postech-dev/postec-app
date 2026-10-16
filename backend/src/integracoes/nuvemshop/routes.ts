import { Router, raw } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import pool from '../../database';
import { authMiddleware } from '../../middlewares/auth.middleware';
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { configuracao, exigirConfiguracao, IntegracaoErro } from './config';
import { assinaturaValida, criptografar, hashEstado } from './seguranca';
import { lerJsonExterno, trocarCodigo } from './api';
import { enfileirar } from './worker';

const wrap = (fn: (req: AuthenticatedRequest, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => { fn(req, res).catch(next); };
const COOKIE = 'postec_nuvemshop_oauth';
const COOKIE_PATH = '/api/integracoes/nuvemshop/callback';

async function acesso(req: AuthenticatedRequest, administrar = false) {
  const user = req.user;
  const r = await pool.query('SELECT u.role,l.plano FROM usuarios u JOIN lojas l ON l.id=u.loja_id WHERE u.id=$1 AND l.id=$2', [user?.id, user?.loja_id]);
  if (!r.rowCount) throw new IntegracaoErro('Loja não encontrada.', 403);
  if (administrar && r.rows[0].role !== 'admin') throw new IntegracaoErro('Somente administradores podem gerenciar a integração.', 403);
  if (!['pro', 'business'].includes(String(r.rows[0].plano).toLowerCase())) throw new IntegracaoErro('A integração Nuvemshop está disponível nos planos Pro e Business.', 403);
  return user!.loja_id;
}

export const nuvemshopRoutes = Router();
nuvemshopRoutes.use(authMiddleware);

nuvemshopRoutes.get('/', wrap(async (req, res) => {
  const lojaId = await acesso(req);
  const config = configuracao();
  const r = await pool.query(`SELECT i.ativa,i.suspensa,i.store_id,i.conectada_em,i.sincronizada_em,i.erro,i.webhooks_em,
    (SELECT count(*)::int FROM pedidos p WHERE p.loja_id=i.loja_id AND p.origem='nuvemshop' AND p.conta_externa_id=i.store_id) AS total,
    (SELECT count(*)::int FROM nuvemshop_tarefas t WHERE t.integracao_id=i.id AND t.geracao=i.geracao AND t.estado IN ('pendente','processando')) AS pendentes,
    (SELECT count(*)::int FROM nuvemshop_tarefas t WHERE t.integracao_id=i.id AND t.geracao=i.geracao AND t.estado='falhou') AS falhas
    FROM integracoes_nuvemshop i WHERE loja_id=$1`, [lojaId]);
  const i = r.rows[0];
  res.json({ conectada: Boolean(i?.ativa), configurada: !config.faltantes.length, pendencias: config.faltantes,
    podeGerenciar: (await pool.query('SELECT role FROM usuarios WHERE id=$1', [req.user!.id])).rows[0]?.role === 'admin',
    storeId: i?.store_id ?? undefined, conectadaEm: i?.conectada_em ?? undefined,
    ultimaSincronizacao: i?.sincronizada_em ?? undefined, suspensa: Boolean(i?.suspensa),
    pedidosImportados: i?.total ?? 0, tarefasPendentes: i?.pendentes ?? 0, tarefasComFalha: i?.falhas ?? 0,
    webhooksAtivos: Boolean(i?.ativa && i.webhooks_em), erro: i?.erro ?? undefined });
}));

nuvemshopRoutes.post('/conectar', wrap(async (req, res) => {
  const lojaId = await acesso(req, true);
  const config = exigirConfiguracao();
  const state = randomBytes(32).toString('hex');
  await pool.query('DELETE FROM nuvemshop_oauth_estados WHERE expira_em<now() OR (loja_id=$1 AND usuario_id=$2)', [lojaId, req.user!.id]);
  await pool.query(`INSERT INTO nuvemshop_oauth_estados (hash,loja_id,usuario_id,expira_em) VALUES ($1,$2,$3,now()+interval '10 minutes')`, [hashEstado(state), lojaId, req.user!.id]);
  res.cookie(COOKIE, state, { httpOnly: true, secure: config.publico.startsWith('https:'), sameSite: 'lax', maxAge: 600_000, path: COOKIE_PATH });
  res.json({ url: `https://www.nuvemshop.com.br/apps/${config.appId}/authorize?state=${state}` });
}));

nuvemshopRoutes.post('/sincronizar', wrap(async (req, res) => {
  const lojaId = await acesso(req, true);
  exigirConfiguracao();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM integracoes_nuvemshop WHERE loja_id=$1 AND ativa AND NOT suspensa FOR UPDATE', [lojaId]);
    if (!r.rowCount) throw new IntegracaoErro('Conecte uma loja ativa antes de sincronizar.', 409);
    const c = r.rows[0];
    await client.query(`UPDATE nuvemshop_tarefas SET estado='pendente',tentativas=0,disponivel_em=now(),erro=NULL WHERE integracao_id=$1 AND geracao=$2 AND estado='falhou'`, [c.id, c.geracao]);
    const tasks = await client.query(`SELECT tipo FROM nuvemshop_tarefas WHERE integracao_id=$1 AND geracao=$2 AND estado IN ('pendente','processando')`, [c.id, c.geracao]);
    if (!tasks.rows.some(t => t.tipo === 'historico' || t.tipo === 'reconciliar')) {
      await enfileirar(c, 'reconciliar', { de: new Date(c.reconciliada_em ? Date.parse(c.reconciliada_em) - 300_000 : Date.now() - 90 * 86400_000).toISOString(), ate: new Date().toISOString(), pagina: 1 }, client);
    }
    if (!tasks.rows.some(t => t.tipo === 'webhooks')) await enfileirar(c, 'webhooks', {}, client);
    await client.query('COMMIT');
    res.status(202).json({ mensagem: 'Sincronização agendada.' });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

nuvemshopRoutes.delete('/', wrap(async (req, res) => {
  const lojaId = await acesso(req, true);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(`UPDATE integracoes_nuvemshop SET ativa=false,token_criptografado=NULL,geracao=geracao+1,erro=NULL,webhooks_em=NULL WHERE loja_id=$1 RETURNING id`, [lojaId]);
    if (r.rowCount) await client.query("UPDATE nuvemshop_tarefas SET estado='cancelada' WHERE integracao_id=$1 AND estado IN ('pendente','processando','falhou')", [r.rows[0].id]);
    await client.query('DELETE FROM nuvemshop_oauth_estados WHERE loja_id=$1', [lojaId]);
    await client.query('COMMIT');
    res.status(204).send();
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

export const nuvemshopPublicRoutes = Router();
nuvemshopPublicRoutes.get('/callback', wrap(async (req, res) => {
  const config = exigirConfiguracao();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const cookie = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
  if (!/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(cookie) || !timingSafeEqual(Buffer.from(state), Buffer.from(cookie))) {
    res.redirect(`${config.publico}/integracoes?nuvemshop=autorizacao_invalida`); return;
  }
  res.clearCookie(COOKIE, { path: COOKIE_PATH, httpOnly: true, sameSite: 'lax', secure: config.publico.startsWith('https:') });
  // Consumir o estado antes da troca impede replay e callbacks simultâneos.
  const r = await pool.query('DELETE FROM nuvemshop_oauth_estados WHERE hash=$1 AND expira_em>now() RETURNING *', [hashEstado(state)]);
  if (!r.rowCount) { res.redirect(`${config.publico}/integracoes?nuvemshop=autorizacao_invalida`); return; }
  const origem = r.rows[0];
  try {
    await acesso({ user: { id: origem.usuario_id, loja_id: origem.loja_id } } as AuthenticatedRequest, true);
    if (typeof req.query.code !== 'string' || !req.query.code || req.query.error) throw new IntegracaoErro('Autorização não concluída.');
    const token = await trocarCodigo(req.query.code);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existente = await client.query('SELECT store_id FROM integracoes_nuvemshop WHERE loja_id=$1 FOR UPDATE', [origem.loja_id]);
      if (existente.rows[0]?.store_id && existente.rows[0].store_id !== token.user_id) throw new IntegracaoErro('A loja autorizada é diferente da loja já vinculada.');
      const c = await client.query(`INSERT INTO integracoes_nuvemshop (loja_id,store_id,token_criptografado,ativa,geracao,conectada_em)
        VALUES ($1,$2,$3,true,1,now()) ON CONFLICT (loja_id) DO UPDATE SET token_criptografado=EXCLUDED.token_criptografado,
        ativa=true,suspensa=false,geracao=integracoes_nuvemshop.geracao+1,conectada_em=now(),erro=NULL,webhooks_em=NULL RETURNING *`,
        [origem.loja_id, token.user_id, criptografar(token.access_token)]);
      const conexao = c.rows[0];
      await client.query("UPDATE nuvemshop_tarefas SET estado='cancelada' WHERE integracao_id=$1 AND estado IN ('pendente','processando','falhou')", [conexao.id]);
      const ate = new Date().toISOString();
      await enfileirar(conexao, 'historico', { de: new Date(Date.now() - 90 * 86400_000).toISOString(), ate, pagina: 1 }, client);
      await enfileirar(conexao, 'webhooks', {}, client);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
    res.redirect(`${config.publico}/integracoes?nuvemshop=conectada`);
  } catch {
    // Não expõe code, tokens nem respostas de autorização no redirecionamento.
    res.redirect(`${config.publico}/integracoes?nuvemshop=erro`);
  }
}));

const ORDER_EVENTS = new Set(['order/created', 'order/updated', 'order/paid', 'order/cancelled']);
nuvemshopPublicRoutes.post('/webhook', raw({ type: 'application/json', limit: '256kb' }), wrap(async (req, res) => {
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody) || !assinaturaValida(rawBody, req.get('x-linkedstore-hmac-sha256'), process.env.NUVEMSHOP_CLIENT_SECRET || '')) {
    res.status(401).json({ mensagem: 'Assinatura inválida.' }); return;
  }
  let body: { store_id: unknown; event: string; id?: unknown };
  try { body = lerJsonExterno(rawBody.toString('utf8')) as typeof body; }
  catch { res.status(400).json({ mensagem: 'Evento inválido.' }); return; }
  if (!body || !/^\d+$/.test(String(body.store_id)) || typeof body.event !== 'string') {
    res.status(400).json({ mensagem: 'Evento inválido.' }); return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(`SELECT i.*,l.plano FROM integracoes_nuvemshop i JOIN lojas l ON l.id=i.loja_id WHERE store_id=$1 AND ativa FOR UPDATE OF i`, [String(body.store_id)]);
    const c = r.rows[0];
    if (c) {
      if (body.event === 'app/uninstalled' && String(body.id) === configuracao().appId) {
        await client.query('UPDATE integracoes_nuvemshop SET ativa=false,token_criptografado=NULL,geracao=geracao+1,webhooks_em=NULL WHERE id=$1', [c.id]);
        await client.query("UPDATE nuvemshop_tarefas SET estado='cancelada' WHERE integracao_id=$1 AND estado IN ('pendente','processando','falhou')", [c.id]);
      } else if (body.event === 'app/suspended') {
        await client.query('UPDATE integracoes_nuvemshop SET suspensa=true WHERE id=$1', [c.id]);
      } else if (body.event === 'app/resumed') {
        await client.query('UPDATE integracoes_nuvemshop SET suspensa=false,reconciliada_em=NULL WHERE id=$1', [c.id]);
        await client.query(`UPDATE nuvemshop_tarefas SET estado='pendente',tentativas=0,disponivel_em=now(),erro=NULL
          WHERE integracao_id=$1 AND geracao=$2 AND estado='falhou'`, [c.id, c.geracao]);
      } else if (ORDER_EVENTS.has(body.event) && /^\d+$/.test(String(body.id)) && ['pro', 'business'].includes(c.plano.toLowerCase())) {
        // Não deduplica pelo hash do payload: order/updated pode repetir o mesmo corpo em mudanças distintas.
        await enfileirar(c, 'pedido', { pedidoId: String(body.id) }, client);
      }
    }
    await client.query('COMMIT');
    res.status(204).send();
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

export function erroIntegracao(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) { next(error); return; }
  if (error instanceof IntegracaoErro) { res.status(error.status).json({ mensagem: error.message }); return; }
  if (error instanceof SyntaxError || error && typeof error === 'object' && 'status' in error && error.status === 413) {
    res.status(error instanceof SyntaxError ? 400 : 413).json({ mensagem: 'Corpo da requisição inválido ou muito grande.' }); return;
  }
  console.error('Falha na API. Verifique o banco de dados, as migrações e a configuração do servidor.');
  res.status(500).json({ mensagem: 'Não foi possível concluir a operação. Tente novamente.' });
}
