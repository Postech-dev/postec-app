// Roda schema + seed via pool pg com client_encoding UTF8
// Uso: node backend/database/seed.js
// Requer: DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT no .env (ou variáveis de ambiente)

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  client_encoding: 'UTF8',
})

async function run() {
  const client = await pool.connect()
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db.sql'), 'utf8')
    const seed   = fs.readFileSync(path.join(__dirname, 'testes.sql'), 'utf8')

    console.log('▶ Rodando db.sql (schema)...')
    await client.query(schema)
    console.log('✓ Schema aplicado.')

    console.log('▶ Rodando testes.sql (seed)...')
    await client.query(seed)
    console.log('✓ Seed aplicado.')

    const { rows } = await client.query(
      "SELECT cliente_nome FROM pedidos WHERE cliente_nome ~ '[À-ú]' LIMIT 5"
    )
    console.log('\nVerificação — nomes com acento no banco:')
    rows.forEach(r => console.log(' ', r.cliente_nome))
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => { console.error(err); process.exit(1) })
