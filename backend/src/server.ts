import 'dotenv/config';
import { app } from './app';
import { iniciarWorker } from './integracoes/nuvemshop/worker';
import pool from './database';

const port = Number(process.env.PORT || 3333);
const server = app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
const pararWorker = iniciarWorker();
async function encerrar() {
  server.close();
  await pararWorker();
  await pool.end();
}
process.once('SIGTERM', encerrar);
process.once('SIGINT', encerrar);
