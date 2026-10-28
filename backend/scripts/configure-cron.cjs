const { Pool } = require('pg');
const path = require('node:path');
const { connectionOptions } = require('../db-options.cjs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

async function main() {
  const url = new URL(process.env.APP_PUBLIC_URL || '');
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('URL pública inválida.');
  }
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 32) throw new Error('CRON_SECRET ausente ou curto.');
  const pool = new Pool({ ...connectionOptions(process.env.DIRECT_URL || process.env.DATABASE_URL), connectionTimeoutMillis: 10_000 });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_cron');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions');
    for (const [name, value] of [
      ['postec_app_url', url.origin], ['postec_cron_secret', process.env.CRON_SECRET],
    ]) {
      const existing = await client.query('SELECT id FROM vault.secrets WHERE name=$1', [name]);
      if (existing.rowCount) await client.query('SELECT vault.update_secret($1::uuid,$2)', [existing.rows[0].id, value]);
      else await client.query('SELECT vault.create_secret($1,$2)', [value, name]);
    }
    await client.query(`SELECT cron.schedule('postec-nuvemshop-worker', '* * * * *', $1)`, [
      `SELECT net.http_get(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='postec_app_url') || '/api/internal/nuvemshop-worker',
        headers := jsonb_build_object('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='postec_cron_secret')),
        timeout_milliseconds := 60000
      );`,
    ]);
    await client.query('COMMIT');
    console.log('Worker agendado no Supabase a cada minuto; segredo armazenado no Vault.');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally { if (client) client.release(); await pool.end(); }
}
main().catch(() => {
  console.error('Não foi possível configurar o agendamento. Confira a conexão, a URL pública e as extensões pg_cron, pg_net e Vault.');
  process.exitCode = 1;
});
