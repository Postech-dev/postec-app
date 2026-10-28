import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app';
import pool from '../src/database';

test('endpoints de produção verificam banco e protegem o worker', async t => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${port}/api`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    t.mock.restoreAll();
  });
  t.mock.method(pool, 'query', async () => ({ rows: [{ '?column?': 1 }] }));
  assert.equal((await fetch(`${base}/health`)).status, 200);
  t.mock.method(pool, 'query', async () => { throw new Error('connection failed'); });
  assert.equal((await fetch(`${base}/health`)).status, 503);
  const original = { secret: process.env.CRON_SECRET, appId: process.env.NUVEMSHOP_APP_ID };
  t.after(() => {
    for (const [key, value] of Object.entries({ CRON_SECRET: original.secret, NUVEMSHOP_APP_ID: original.appId })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  delete process.env.CRON_SECRET;
  assert.equal((await fetch(`${base}/internal/nuvemshop-worker`)).status, 401);
  process.env.CRON_SECRET = 'segredo-de-teste';
  assert.equal((await fetch(`${base}/internal/nuvemshop-worker`, { headers: { Authorization: 'Bearer errado' } })).status, 401);
  process.env.NUVEMSHOP_APP_ID = '';
  const authorized = await fetch(`${base}/internal/nuvemshop-worker`, { headers: { Authorization: 'Bearer segredo-de-teste' } });
  assert.equal(authorized.status, 200);
  assert.equal((await authorized.json()).status, 'not_configured');
});
