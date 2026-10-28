import { attachDatabasePool } from '@vercel/functions';
import { app } from '../backend/src/app';
import pool from '../backend/src/database';

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configure DATABASE_URL e JWT_SECRET (mínimo de 32 caracteres) na Vercel.');
}

attachDatabasePool(pool);
export default app;
