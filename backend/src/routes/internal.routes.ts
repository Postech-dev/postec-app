import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import pool from '../database';
import { configuracao } from '../integracoes/nuvemshop/config';
import { agendarReconciliacoes, processarProximaTarefa } from '../integracoes/nuvemshop/worker';

export const internalRoutes = Router();

internalRoutes.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
});

internalRoutes.get('/internal/nuvemshop-worker', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const received = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    res.status(401).json({ mensagem: 'Não autorizado.' });
    return;
  }
  if (configuracao().faltantes.length) {
    res.json({ status: 'not_configured', processadas: 0 });
    return;
  }
  try {
    await agendarReconciliacoes();
    const deadline = Date.now() + 35_000;
    let processadas = 0;
    while (Date.now() < deadline && await processarProximaTarefa()) processadas++;
    res.json({ status: 'ok', processadas });
  } catch {
    res.status(503).json({ mensagem: 'Não foi possível processar a fila.' });
  }
});
