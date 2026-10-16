import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import pool from '../src/database';
import { app } from '../src/app';
import { processarProximaTarefa } from '../src/integracoes/nuvemshop/worker';
import { salvarPedidoExterno } from '../src/integracoes/nuvemshop/pedidos';
import { pedido } from './fixtures/nuvemshop';

test('fluxo Nuvemshop com HTTP real, API externa simulada e PostgreSQL isolado', async t => {
  assert.match(process.env.DATABASE_URL || '', /\/postec_test$/);
  Object.assign(process.env, { NUVEMSHOP_APP_ID: '46963', NUVEMSHOP_CLIENT_SECRET: 'segredo-de-teste',
    APP_PUBLIC_URL: 'https://postec.test', NUVEMSHOP_USER_AGENT: 'Postec test', JWT_SECRET: 'jwt-apenas-teste',
    INTEGRATION_ENCRYPTION_KEY: randomBytes(32).toString('base64') });
  for (const file of ['db.sql', 'migracao-01.sql', 'migracao-02-nuvemshop.sql', 'migracao-02-nuvemshop.sql']) {
    await pool.query(await readFile(`database/${file}`, 'utf8'));
  }
  const lojas = await pool.query(`INSERT INTO lojas (nome,slug,email,plano) VALUES
    ('Teste A','teste-a','a@example.test','Pro'),('Teste B','teste-b','b@example.test','Business'),
    ('Starter','teste-starter','s@example.test','Starter') RETURNING id`);
  const [lojaA, lojaB, lojaStarter] = lojas.rows.map(l => l.id);
  const users = await pool.query(`INSERT INTO usuarios (loja_id,nome,email,senha,role) VALUES
    ($1,'Admin A','admina@example.test','nao-usada','admin'),($2,'Admin B','adminb@example.test','nao-usada','admin'),
    ($1,'Atendente','atendente@example.test','nao-usada','atendente'),($3,'Starter','starter@example.test','nao-usada','admin') RETURNING id,loja_id,role`, [lojaA, lojaB, lojaStarter]);
  const tokens = users.rows.map(u => jwt.sign({ ...u, nome: 'Teste', email: 'test@example.test' }, process.env.JWT_SECRET!));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  const originalFetch = globalThis.fetch;
  let storeId = '321'; let order = structuredClone(pedido); let falhar = 0; let authCalls = 0;
  const hooks: { id: number; event: string; url: string }[] = [];
  const requests: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.origin === base) return originalFetch(input, init);
    assert.ok(['www.nuvemshop.com.br', 'api.nuvemshop.com.br'].includes(url.hostname), 'Nenhuma chamada a serviços reais');
    requests.push(`${init?.method || 'GET'} ${url.pathname}`);
    if (url.pathname.endsWith('/authorize/token')) {
      authCalls++;
      return Response.json({ access_token: `token-privado-${storeId}`, user_id: storeId, scope: 'read_orders' });
    }
    if (falhar) { const codigo = falhar; falhar = 0; return Response.json({}, { status: codigo }); }
    if (url.pathname.endsWith('/webhooks')) {
      if (init?.method === 'POST') { const h = { id: hooks.length + 1, ...JSON.parse(String(init.body)) }; hooks.push(h); return Response.json(h); }
      return Response.json(hooks.filter(h => h.event === url.searchParams.get('event') && h.url === url.searchParams.get('url')));
    }
    if (url.pathname.endsWith('/orders')) return Response.json([order]);
    if (url.pathname.includes('/orders/')) return Response.json(order);
    throw new Error('Recurso externo não previsto no teste');
  });
  t.after(async () => {
    t.mock.restoreAll();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
  });
  async function api(path: string, token = tokens[0], method = 'GET', body?: unknown, extra: Record<string, string> = {}) {
    return fetch(base + path, { method, redirect: 'manual', headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  async function conectar(token = tokens[0]) {
    const inicio = await api('/api/integracoes/nuvemshop/conectar', token, 'POST');
    assert.equal(inicio.status, 200);
    const { url } = await inicio.json() as { url: string };
    const state = new URL(url).searchParams.get('state');
    const cookie = inicio.headers.get('set-cookie')!.split(';')[0];
    const callback = `/api/integracoes/nuvemshop/callback?code=teste&state=${state}`;
    return { resposta: await api(callback, token, 'GET', undefined, { Cookie: cookie }), callback, cookie };
  }
  async function drenar(max = 60) {
    let n = 0;
    while (n++ < max && await processarProximaTarefa()) { /* worker executado sob controle do teste */ }
    assert.ok(n < max, 'A fila deve terminar');
  }
  async function webhook(data: unknown, assinar = true) {
    const raw = JSON.stringify(data);
    const sig = createHmac('sha256', process.env.NUVEMSHOP_CLIENT_SECRET!).update(raw).digest('hex');
    return fetch(base + '/api/integracoes/nuvemshop/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json',
      'x-linkedstore-hmac-sha256': assinar ? sig : '0'.repeat(64) }, body: raw });
  }

  await t.test('configuração incompleta é visível e acesso respeita papel/plano', async () => {
    const secret = process.env.NUVEMSHOP_CLIENT_SECRET;
    delete process.env.NUVEMSHOP_CLIENT_SECRET;
    const status = await (await api('/api/integracoes/nuvemshop')).json() as { configurada: boolean };
    assert.equal(status.configurada, false);
    assert.equal((await api('/api/integracoes/nuvemshop/conectar', tokens[0], 'POST')).status, 503);
    process.env.NUVEMSHOP_CLIENT_SECRET = secret;
    assert.equal((await api('/api/integracoes/nuvemshop/conectar', tokens[2], 'POST')).status, 403);
    assert.equal((await api('/api/integracoes/nuvemshop', tokens[3])).status, 403);
    assert.equal((await fetch(base + '/api/integracoes/nuvemshop')).status, 401);
  });
  await t.test('callback sem vínculo de navegador não troca código e estado não pode ser reutilizado', async () => {
    const invalid = await api('/api/integracoes/nuvemshop/callback?code=teste&state=' + 'a'.repeat(64));
    assert.match(invalid.headers.get('location')!, /autorizacao_invalida/); assert.equal(authCalls, 0);
    const c = await conectar();
    assert.match(c.resposta.headers.get('location')!, /nuvemshop=conectada/);
    const again = await api(c.callback, tokens[0], 'GET', undefined, { Cookie: c.cookie });
    assert.match(again.headers.get('location')!, /autorizacao_invalida/); assert.equal(authCalls, 1);
    const stored = await pool.query('SELECT token_criptografado FROM integracoes_nuvemshop WHERE loja_id=$1', [lojaA]);
    assert.ok(!stored.rows[0].token_criptografado.includes('token-privado'));
    assert.ok(!(await (await api('/api/integracoes/nuvemshop')).text()).includes('token-privado'));
  });
  await t.test('histórico com vários itens chega ao painel sem CPF/email e sem duplicação entre janelas', async () => {
    await drenar();
    const result = await (await api('/api/pedidos')).json() as Record<string, unknown>[];
    assert.equal(result.length, 1); assert.equal(result[0].pedido_externo_id, pedido.id);
    assert.equal(result[0].cliente_cpf, null); assert.equal(result[0].cliente_email, null);
    assert.equal((result[0].itens as unknown[]).length, 2); assert.equal(result[0].quantidade, 3);
    assert.equal(hooks.length, 7);
    assert.equal((await api('/api/pedidos/' + result[0].pedido_id, tokens[1])).status, 404);
    assert.equal((await (await api('/api/pedidos', tokens[1])).json() as unknown[]).length, 0);
  });
  await t.test('webhook exige assinatura e o mesmo payload pode anunciar alterações diferentes', async () => {
    const event = { store_id: 321, event: 'order/updated', id: pedido.id };
    assert.equal((await webhook(event, false)).status, 401);
    order = { ...order, status: 'closed', updated_at: '2026-10-02T12:00:00Z' };
    assert.equal((await webhook(event)).status, 204); await drenar();
    order = { ...order, status: 'cancelled', updated_at: '2026-10-03T12:00:00Z' };
    assert.equal((await webhook(event)).status, 204); await drenar();
    let result = await (await api('/api/pedidos')).json() as Record<string, unknown>[];
    assert.equal(result.length, 1); assert.equal(result[0].status_pedido, 'cancelled');
    order = { ...order, status: 'open', updated_at: '2026-10-01T12:00:00Z' };
    await webhook(event); await drenar();
    result = await (await api('/api/pedidos')).json() as Record<string, unknown>[];
    assert.equal(result[0].status_pedido, 'cancelled', 'Atualização antiga não sobrescreve a nova');
  });
  await t.test('limitação da API agenda retry persistente e retoma sem duplicar', async () => {
    falhar = 429;
    await webhook({ store_id: 321, event: 'order/paid', id: pedido.id });
    await processarProximaTarefa();
    const retry = await pool.query("SELECT * FROM nuvemshop_tarefas WHERE estado='pendente' AND tentativas>0");
    assert.equal(retry.rowCount, 1); assert.match(retry.rows[0].erro, /Limite/);
    await pool.query('UPDATE nuvemshop_tarefas SET disponivel_em=now() WHERE id=$1', [retry.rows[0].id]);
    await drenar();
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM pedidos WHERE loja_id=$1", [lojaA])).rows[0].n, 1);
  });
  await t.test('outra loja não pode capturar a conexão já autorizada', async () => {
    const c = await conectar(tokens[1]); assert.match(c.resposta.headers.get('location')!, /nuvemshop=erro/);
    assert.equal((await pool.query('SELECT id FROM integracoes_nuvemshop WHERE loja_id=$1', [lojaB])).rowCount, 0);
    storeId = '654'; order = { ...pedido, store_id: storeId };
    const b = await conectar(tokens[1]); assert.match(b.resposta.headers.get('location')!, /nuvemshop=conectada/);
    await drenar();
    const a = await (await api('/api/pedidos')).json() as Record<string, unknown>[];
    const other = await (await api('/api/pedidos', tokens[1])).json() as Record<string, unknown>[];
    assert.equal(other.length, 1); assert.equal(a[0].numero_pedido, other[0].numero_pedido);
    assert.notEqual(a[0].pedido_id, other[0].pedido_id);
  });
  await t.test('cadastro/CSV reais preservam pedidos externos e fazem rollback de colisões', async () => {
    const manual = { numero: 'MANUAL-1', clienteNome: 'Cliente manual', clienteEmail: 'm@example.test',
      clienteCpf: '52998224725', produto: 'Produto', quantidade: 2, valor: 40, dataPedido: '2026-10-01' };
    assert.equal((await api('/api/pedidos', tokens[0], 'POST', manual)).status, 201);
    assert.equal((await api('/api/pedidos', tokens[0], 'POST', { ...manual, clienteCpf: '11111111111' })).status, 400);
    const csv = await api('/api/pedidos/importacoes', tokens[0], 'POST', { linhas: [{ ...manual, valor: 42 }] });
    assert.deepEqual(await csv.json(), { novos: 0, atualizados: 1 });
    assert.equal((await api('/api/pedidos/importacoes', tokens[0], 'POST', { linhas: [{ ...manual, numero: 'ROLLBACK' }, { ...manual, numero: '120' }] })).status, 409);
    assert.equal((await pool.query("SELECT id FROM pedidos WHERE numero_pedido='ROLLBACK'")).rowCount, 0);
  });
  await t.test('contato de pedido importado é persistido e respeita loja e plano', async () => {
    const pedidoB = (await pool.query("SELECT id FROM pedidos WHERE loja_id=$1", [lojaB])).rows[0].id;
    const dados = { pedido_id: pedidoB, motivo: 'Troca', canal: 'telefone', relato: 'Relato interno', primeira_mensagem: 'Vamos ajudar na troca.' };
    assert.equal((await api('/api/painel/ocorrencias', tokens[0], 'POST', dados)).status, 403);
    const foreign = (await pool.query('SELECT id FROM pedidos WHERE loja_id=$1 LIMIT 1', [lojaA])).rows[0].id;
    assert.equal((await api('/api/painel/ocorrencias', tokens[1], 'POST', { ...dados, pedido_id: foreign })).status, 404);
    const created = await api('/api/painel/ocorrencias', tokens[1], 'POST', dados);
    assert.equal(created.status, 201);
    const { protocolo } = await created.json() as { protocolo: string };
    const detail = await (await api('/api/painel/ocorrencias/' + protocolo, tokens[1])).json() as { pedido_id: number; mensagens: { interna: boolean }[] };
    assert.equal(detail.pedido_id, pedidoB); assert.equal(detail.mensagens.length, 3);
    assert.equal(detail.mensagens.filter(m => m.interna).length, 1);
    assert.equal((await api('/api/painel/ocorrencias/' + protocolo, tokens[0])).status, 404);
  });
  await t.test('suspensão pausa o processamento e retomada permite repetir falhas', async () => {
    await webhook({ store_id: 321, event: 'app/suspended', id: 46963 });
    await webhook({ store_id: 321, event: 'order/updated', id: pedido.id });
    assert.equal(await processarProximaTarefa(), false);
    const status = await (await api('/api/integracoes/nuvemshop')).json() as { suspensa: boolean };
    assert.equal(status.suspensa, true);
    await pool.query(`UPDATE nuvemshop_tarefas SET estado='falhou',tentativas=5 WHERE estado='pendente' AND integracao_id=(SELECT id FROM integracoes_nuvemshop WHERE loja_id=$1)`, [lojaA]);
    await webhook({ store_id: 321, event: 'app/resumed', id: 46963 });
    const pendentes = await pool.query("SELECT id,tentativas FROM nuvemshop_tarefas WHERE estado='pendente'");
    assert.equal(pendentes.rowCount, 1); assert.equal(pendentes.rows[0].tentativas, 0);
    // A API simulada volta à conta original para processar a tarefa retomada.
    order = structuredClone(pedido);
    await drenar();
  });
  await t.test('desconexão cancela tarefas, remove token e bloqueia gravação de uma geração anterior', async () => {
    const conexao = (await pool.query('SELECT * FROM integracoes_nuvemshop WHERE loja_id=$1', [lojaA])).rows[0];
    await webhook({ store_id: 321, event: 'order/updated', id: pedido.id });
    assert.equal((await api('/api/integracoes/nuvemshop', tokens[0], 'DELETE')).status, 204);
    const c = (await pool.query('SELECT * FROM integracoes_nuvemshop WHERE loja_id=$1', [lojaA])).rows[0];
    assert.equal(c.token_criptografado, null); assert.equal(c.ativa, false);
    const client = await pool.connect();
    try { await assert.rejects(salvarPedidoExterno(client, conexao, pedido), /interrompida/); }
    finally { client.release(); }
    assert.equal((await pool.query("SELECT id FROM nuvemshop_tarefas WHERE integracao_id=$1 AND estado='pendente'", [conexao.id])).rowCount, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM pedidos WHERE loja_id=$1', [lojaA])).rows[0].n, 2);
  });
  assert.ok(requests.every(r => !r.includes('localhost')), 'Somente os hosts oficiais são usados pelo conector');
});
