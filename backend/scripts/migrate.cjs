const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { connectionOptions } = require('../db-options.cjs');
const pool = new Pool({ ...connectionOptions(databaseUrl), connectionTimeoutMillis: 10_000 });

(async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock(46963, 0)');
    if (process.argv.includes('--init')) {
      await client.query(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
      console.log('Schema inicial criado sem dados de teste.');
    }
    // As migrações são aditivas/reexecutáveis; não roda seeds nem recria dados.
    for (const name of fs.readdirSync(path.join(__dirname, '../database')).filter(n => /^migracao-.*\.sql$/.test(n)).sort()) {
      await client.query(fs.readFileSync(path.join(__dirname, '../database', name), 'utf8'));
      console.log(`Migração aplicada: ${name}`);
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (client) {
      try { await client.query('SELECT pg_advisory_unlock(46963, 0)'); } finally { client.release(); }
    }
    await pool.end();
  }
})().catch(() => { console.error('Não foi possível aplicar as migrações. Confira a conexão e se o schema inicial existe.'); process.exitCode = 1; });
