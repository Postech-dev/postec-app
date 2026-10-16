import pool from '../../database';
import type { PoolClient } from 'pg';
import { chamarNuvemshop, NuvemshopApiErro } from './api';
import { configuracao } from './config';
import { descriptografar } from './seguranca';
import { salvarPedidoExterno } from './pedidos';
import type { Conexao, PedidoExterno } from './pedidos';

type Tipo = 'webhooks' | 'historico' | 'reconciliar' | 'pedido';
interface Parametros { pagina?: number; de?: string; ate?: string; pedidoId?: string; }
interface Tarefa { id: string; integracao_id: number; geracao: number; tipo: Tipo; parametros: Parametros; tentativas: number; }

export async function enfileirar(conexao: Pick<Conexao, 'id' | 'geracao'>, tipo: Tipo, parametros: Parametros = {}, client: Pick<PoolClient, 'query'> = pool) {
  await client.query(`INSERT INTO nuvemshop_tarefas (integracao_id,geracao,tipo,parametros) VALUES ($1,$2,$3,$4)`,
    [conexao.id, conexao.geracao, tipo, JSON.stringify(parametros)]);
}

const EVENTOS = ['order/created', 'order/updated', 'order/paid', 'order/cancelled', 'app/uninstalled', 'app/suspended', 'app/resumed'];

async function registrarWebhooks(c: Conexao, token: string) {
  const url = configuracao().webhook;
  if (!url.startsWith('https://')) throw new Error('Configure a URL HTTPS do Postec para receber atualizações automáticas.');
  type Hook = { id: number; event: string; url: string };
  // A consulta é filtrada por URL e evento para não alterar webhooks de outros ambientes.
  for (const event of EVENTOS) {
    const existentes = await chamarNuvemshop<Hook[]>(c.store_id, token,
      `/webhooks?event=${encodeURIComponent(event)}&url=${encodeURIComponent(url)}&per_page=200`);
    if (!existentes.some(h => h.event === event && h.url === url)) {
      await chamarNuvemshop(c.store_id, token, '/webhooks', 'POST', { event, url });
    }
    await new Promise(resolve => setTimeout(resolve, 1100));
  }
  await pool.query('UPDATE integracoes_nuvemshop SET webhooks_em=now() WHERE id=$1 AND geracao=$2 AND ativa', [c.id, c.geracao]);
}

async function executar(client: PoolClient, job: Tarefa, c: Conexao) {
  const token = descriptografar(c.token_criptografado);
  if (job.tipo === 'webhooks') return registrarWebhooks(c, token);
  if (job.tipo === 'pedido') {
    if (!/^\d+$/.test(job.parametros.pedidoId || '')) throw new Error('Identificador de pedido inválido.');
    const p = await chamarNuvemshop<PedidoExterno>(c.store_id, token, `/orders/${job.parametros.pedidoId}`);
    await salvarPedidoExterno(client, c, p);
  } else {
    const { de, ate, pagina = 1 } = job.parametros;
    if (!de || !ate) throw new Error('Período de sincronização ausente.');
    // Janelas de sete dias evitam exceder o limite de resultados por consulta no piloto.
    const fimJanela = new Date(Math.min(Date.parse(ate), Date.parse(de) + 7 * 86400_000)).toISOString();
    const campo = job.tipo === 'historico' ? 'created_at' : 'updated_at';
    const query = new URLSearchParams({ [`${campo}_min`]: de, [`${campo}_max`]: fimJanela,
      page: String(pagina), per_page: '100', status: 'any', payment_status: 'any' });
    const pedidos = await chamarNuvemshop<PedidoExterno[]>(c.store_id, token, `/orders?${query}`);
    if (!Array.isArray(pedidos)) throw new Error('Resposta de pedidos inválida.');
    for (const pedido of pedidos) await salvarPedidoExterno(client, c, pedido);
    // Continuação e conclusão da página ficam na mesma transação; retentar só faz upsert.
    await client.query('BEGIN');
    try {
      const atual = await client.query('SELECT id FROM integracoes_nuvemshop WHERE id=$1 AND geracao=$2 AND ativa FOR UPDATE', [c.id, c.geracao]);
      if (!atual.rowCount) throw new Error('A conexão foi interrompida.');
      if (pedidos.length === 100) {
        await enfileirar(c, job.tipo, { ...job.parametros, pagina: pagina + 1 }, client);
      } else if (Date.parse(fimJanela) < Date.parse(ate)) {
        await enfileirar(c, job.tipo, { de: fimJanela, ate, pagina: 1 }, client);
      } else {
        await client.query(`UPDATE integracoes_nuvemshop SET reconciliada_em=GREATEST(reconciliada_em,$1::timestamptz) WHERE id=$2`, [ate, c.id]);
      }
      await client.query("UPDATE nuvemshop_tarefas SET estado='concluida',erro=NULL WHERE id=$1", [job.id]);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
  }
  await pool.query('UPDATE integracoes_nuvemshop SET sincronizada_em=now() WHERE id=$1 AND geracao=$2 AND ativa', [c.id, c.geracao]);
}

// Uma tarefa por execução. SKIP LOCKED e lock por conexão permitem mais de um processo com segurança.
export async function processarProximaTarefa(): Promise<boolean> {
  if (configuracao().faltantes.length) return false;
  const client = await pool.connect();
  let job: Tarefa | undefined;
  let locked = false;
  try {
    const r = await client.query(`UPDATE nuvemshop_tarefas SET estado='processando', iniciada_em=now(), tentativas=tentativas+1
      WHERE id=(SELECT t.id FROM nuvemshop_tarefas t JOIN integracoes_nuvemshop i ON i.id=t.integracao_id
        JOIN lojas l ON l.id=i.loja_id
        WHERE ((t.estado='pendente' AND t.disponivel_em<=now()) OR (t.estado='processando' AND t.iniciada_em<now()-interval '10 minutes'))
        AND i.ativa AND NOT i.suspensa AND i.geracao=t.geracao AND lower(l.plano) IN ('pro','business')
        ORDER BY t.id FOR UPDATE OF t SKIP LOCKED LIMIT 1) RETURNING *`);
    job = r.rows[0];
    if (!job) return false;
    const lock = await client.query('SELECT pg_try_advisory_lock(46963, $1) AS ok', [job.integracao_id]);
    locked = lock.rows[0].ok;
    if (!locked) {
      await client.query("UPDATE nuvemshop_tarefas SET estado='pendente',disponivel_em=now()+interval '5 seconds',tentativas=tentativas-1 WHERE id=$1", [job.id]);
      return false;
    }
    const c = await client.query(`SELECT * FROM integracoes_nuvemshop WHERE id=$1 AND geracao=$2 AND ativa AND NOT suspensa`, [job.integracao_id, job.geracao]);
    if (c.rowCount) await executar(client, job, c.rows[0]);
    await client.query("UPDATE nuvemshop_tarefas SET estado=$2,erro=NULL WHERE id=$1", [job.id, c.rowCount ? 'concluida' : 'cancelada']);
    const falhas = await client.query(`SELECT id FROM nuvemshop_tarefas WHERE integracao_id=$1 AND geracao=$2 AND estado IN ('pendente','falhou') LIMIT 1`, [job.integracao_id, job.geracao]);
    if (!falhas.rowCount) await client.query('UPDATE integracoes_nuvemshop SET erro=NULL WHERE id=$1 AND geracao=$2', [job.integracao_id, job.geracao]);
    return true;
  } catch (error) {
    if (!job) throw error;
    const atual = await client.query('SELECT id FROM integracoes_nuvemshop WHERE id=$1 AND geracao=$2 AND ativa', [job.integracao_id, job.geracao]);
    if (!atual.rowCount) {
      await client.query("UPDATE nuvemshop_tarefas SET estado='cancelada' WHERE id=$1", [job.id]);
      return true;
    }
    // Não registra respostas HTTP externas, credenciais ou payloads com dados pessoais.
    const msg = error instanceof NuvemshopApiErro ? error.message :
      error instanceof Error && /^(A Nuvemshop retornou|Configure a URL HTTPS)/.test(error.message) ? error.message :
      'A sincronização não foi concluída. Tentaremos novamente; se persistir, reconecte a loja.';
    const definitiva = job.tentativas >= 5 || error instanceof NuvemshopApiErro && [401, 403, 402].includes(error.codigo);
    await client.query(`UPDATE nuvemshop_tarefas SET estado=$2,erro=$3,disponivel_em=now()+($4 * interval '1 second') WHERE id=$1`,
      [job.id, definitiva ? 'falhou' : 'pendente', msg, Math.min(900, 30 * 2 ** job.tentativas)]);
    await client.query('UPDATE integracoes_nuvemshop SET erro=$1 WHERE id=$2 AND geracao=$3', [msg, job.integracao_id, job.geracao]);
    return true;
  } finally {
    if (locked && job) await client.query('SELECT pg_advisory_unlock(46963,$1)', [job.integracao_id]);
    client.release();
  }
}

export async function agendarReconciliacoes() {
  await pool.query(`INSERT INTO nuvemshop_tarefas (integracao_id,geracao,tipo,parametros)
    SELECT i.id,i.geracao,'reconciliar',jsonb_build_object('de',COALESCE(i.reconciliada_em-interval '5 minutes',now()-interval '90 days'),'ate',now(),'pagina',1)
    FROM integracoes_nuvemshop i JOIN lojas l ON l.id=i.loja_id WHERE i.ativa AND NOT i.suspensa AND lower(l.plano) IN ('pro','business')
      AND (i.reconciliada_em IS NULL OR i.reconciliada_em<now()-interval '1 hour')
      AND NOT EXISTS (SELECT 1 FROM nuvemshop_tarefas t WHERE t.integracao_id=i.id AND t.geracao=i.geracao
        AND t.tipo IN ('historico','reconciliar') AND t.estado IN ('pendente','processando','falhou'))`);
}

export function iniciarWorker() {
  let ocupado = false;
  let ultimoAgendamento = 0;
  let encerrado = false;
  const timer = setInterval(async () => {
    if (ocupado || encerrado || configuracao().faltantes.length) return;
    ocupado = true;
    try {
      if (Date.now() - ultimoAgendamento > 60_000) { await agendarReconciliacoes(); ultimoAgendamento = Date.now(); }
      await processarProximaTarefa();
    } catch { console.error('Worker Nuvemshop: verifique a conexão com o banco e as migrações.'); }
    finally { ocupado = false; }
  }, 2000);
  timer.unref();
  return async () => { encerrado = true; clearInterval(timer); while (ocupado) await new Promise(r => setTimeout(r, 50)); };
}
