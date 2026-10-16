const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT || 5432),
});

(async () => {
  const client = await pool.connect();
  try {
    // As migrações são aditivas/reexecutáveis; não roda seeds nem recria dados.
    for (const name of fs.readdirSync(path.join(__dirname, '../database')).filter(n => /^migracao-.*\.sql$/.test(n)).sort()) {
      await client.query(fs.readFileSync(path.join(__dirname, '../database', name), 'utf8'));
      console.log(`Migração aplicada: ${name}`);
    }
  } finally { client.release(); await pool.end(); }
})().catch(() => { console.error('Não foi possível aplicar as migrações. Confira a conexão e se o schema inicial existe.'); process.exitCode = 1; });
