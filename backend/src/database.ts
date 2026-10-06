import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

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