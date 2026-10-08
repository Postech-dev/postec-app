import { Pool, types } from "pg";
import dotenv from "dotenv";

dotenv.config();

// datas e horários voltam como texto do banco ("2026-10-06 10:30:00"), sem virar Date.
// assim o horário que o front mostra é o mesmo gravado, sem depender do fuso do servidor
types.setTypeParser(1114, (valor: string) => valor); // TIMESTAMP
types.setTypeParser(1082, (valor: string) => valor); // DATE

const pool = new Pool({
  user:  process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

  pool.on("connect", () => {
    console.log("Banco de dados conectado com sucesso");
});

  pool.on("error", (err) => {
    console.log("Erro ao conectar ao banco de dados", err);
});

export default pool;
