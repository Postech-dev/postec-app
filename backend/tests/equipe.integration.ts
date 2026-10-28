import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../src/database';
import { app } from '../src/app';

test('equipe persiste usuários reais e isola lojas e permissões', async t => {
  assert.match(process.env.DATABASE_URL || '', /\/postec_test$/);
  process.env.JWT_SECRET = 'jwt-exclusivo-do-teste-de-equipe';
  for (const file of ['schema.sql', ...(await readdir('database')).filter(f => /^migracao-.*\.sql$/.test(f)).sort()]) {
    await pool.query(await readFile(`database/${file}`, 'utf8'));
  }
  const lojas = (await pool.query(`INSERT INTO lojas(nome,slug,email) VALUES
    ('Loja A','equipe-a','a@example.invalid'),('Loja B','equipe-b','b@example.invalid') RETURNING id`)).rows;
  const hash = await bcrypt.hash('senha-inicial', 10);
  const users = (await pool.query(`INSERT INTO usuarios(loja_id,nome,email,senha,role) VALUES
    ($1,'Admin A','admin-a@example.invalid',$3,'admin'),
    ($2,'Admin B','admin-b@example.invalid',$3,'admin'),
    ($1,'Atendente A','atendente-a@example.invalid',$3,'atendente') RETURNING id,loja_id,role`, [lojas[0].id, lojas[1].id, hash])).rows;
  const tokens = users.map(u => jwt.sign({ ...u, nome: 'Teste', email: 'teste@example.invalid' }, process.env.JWT_SECRET!));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as import('node:net').AddressInfo;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
  });
  async function api(path = '/equipe', token: string | null = tokens[0], body?: unknown) {
    return fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  const novo = { nome: 'Nova pessoa', email: 'nova@example.invalid', senha: 'senha-segura' };

  await t.test('exige sessão e não permite escolher a loja por query string', async () => {
    assert.equal((await api('/equipe', null)).status, 401);
    assert.equal((await api('/equipe', null, novo)).status, 401);
    const r = await api(`/equipe?loja_id=${lojas[1].id}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('cache-control')!, /no-store/);
    const equipe = await r.json();
    assert.deepEqual(equipe.map((u: { id: number }) => u.id), [users[0].id, users[2].id]);
    assert.ok(equipe.every((u: { loja_id: number; senha?: string }) => u.loja_id === lojas[0].id && !('senha' in u)));
    const outra = await (await api('/equipe', tokens[1])).json();
    assert.deepEqual(outra.map((u: { id: number }) => u.id), [users[1].id]);
  });
  await t.test('cria na loja da sessão, grava hash e permite login real', async () => {
    const r = await api('/equipe', tokens[0], { ...novo, loja_id: lojas[1].id });
    assert.equal(r.status, 201);
    const criado = await r.json();
    assert.equal(criado.loja_id, lojas[0].id);
    assert.equal(criado.role, 'atendente');
    assert.ok(!('senha' in criado));
    const persisted = (await pool.query('SELECT * FROM usuarios WHERE id=$1', [criado.id])).rows[0];
    assert.notEqual(persisted.senha, novo.senha);
    assert.ok(await bcrypt.compare(novo.senha, persisted.senha));
    const outra = await (await api('/equipe', tokens[1])).json();
    assert.ok(!outra.some((u: { id: number }) => u.id === criado.id));
    const login = await api('/auth/login', null, { email: novo.email.toUpperCase(), senha: novo.senha });
    assert.equal(login.status, 200);
    const sessao = await login.json();
    assert.equal(sessao.usuario.loja_id, lojas[0].id);
    assert.equal(sessao.usuario.role, 'atendente');
  });
  await t.test('bloqueia atendente, promoção por payload e JWT de administrador desatualizado', async () => {
    assert.equal((await api('/equipe', tokens[2], { ...novo, email: 'negado@example.invalid' })).status, 403);
    assert.equal((await api('/equipe', tokens[0], { ...novo, role: 'admin' })).status, 400);
    await pool.query("UPDATE usuarios SET role='atendente' WHERE id=$1", [users[0].id]);
    assert.equal((await api('/equipe', tokens[0], { ...novo, email: 'negado@example.invalid' })).status, 403);
    await pool.query("UPDATE usuarios SET role='admin',loja_id=$2 WHERE id=$1", [users[0].id, lojas[1].id]);
    assert.equal((await api('/equipe', tokens[0])).status, 401);
    assert.equal((await api('/equipe', tokens[0], novo)).status, 401);
    await pool.query('UPDATE usuarios SET loja_id=$2 WHERE id=$1', [users[0].id, lojas[0].id]);
  });
  await t.test('e-mail é único entre lojas, inclusive maiúsculas e criações simultâneas', async () => {
    const conflict = await api('/equipe', tokens[0], { ...novo, email: 'ADMIN-B@EXAMPLE.INVALID' });
    assert.equal(conflict.status, 409);
    assert.equal((await api('/auth/cadastro', null, { nome: 'Teste', loja: 'Outra', email: 'ADMIN-B@EXAMPLE.INVALID', senha: 'senha-inicial' })).status, 409);
    const results = await Promise.all([
      api('/equipe', tokens[0], { ...novo, email: 'corrida@example.invalid' }),
      api('/equipe', tokens[1], { ...novo, email: 'CORRIDA@EXAMPLE.INVALID' }),
    ]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM usuarios WHERE lower(email)='corrida@example.invalid'")).rows[0].n, 1);
  });
  await t.test('valida dados e não altera o banco quando o formulário é inválido', async () => {
    const before = (await pool.query('SELECT count(*)::int AS n FROM usuarios')).rows[0].n;
    for (const body of [{ ...novo, nome: '' }, { ...novo, email: 'invalido' }, { ...novo, senha: '123' }, { ...novo, nome: 'x'.repeat(101) }, null]) {
      assert.equal((await api('/equipe', tokens[0], body)).status, 400);
    }
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM usuarios')).rows[0].n, before);
  });
});
