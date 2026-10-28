import { Pool, types } from "pg";
import dotenv from "dotenv";
import { connectionOptions } from "../db-options.cjs";

dotenv.config();

// datas e horários voltam como texto do banco ("2026-10-06 10:30:00"), sem virar Date.
// assim o horário que o front mostra é o mesmo gravado, sem depender do fuso do servidor
types.setTypeParser(1114, (valor: string) => valor); // TIMESTAMP
types.setTypeParser(1082, (valor: string) => valor); // DATE

const pool = new Pool({
  ...connectionOptions(process.env.DATABASE_URL),
  client_encoding: 'UTF8',
  max: Number(process.env.DB_POOL_MAX || 3),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});

  pool.on("connect", () => {
    console.log("Banco de dados conectado com sucesso");
});

  pool.on("error", (err) => {
    console.log("Erro ao conectar ao banco de dados", err);
});

export default pool;
