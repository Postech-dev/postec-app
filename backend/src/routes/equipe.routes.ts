import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database';
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const membro = await pool.query('SELECT id FROM usuarios WHERE id=$1 AND loja_id=$2', [req.user!.id, req.user!.loja_id]);
    if (!membro.rowCount) { res.status(401).json({ mensagem: 'Sua conta não pertence mais a esta loja. Entre novamente.' }); return; }
    const result = await pool.query(`SELECT u.id,u.nome,u.email,u.role,u.loja_id,l.nome AS loja_nome
      FROM usuarios u JOIN lojas l ON l.id=u.loja_id WHERE u.loja_id=$1 ORDER BY u.id`, [req.user!.loja_id]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ mensagem: 'Não foi possível carregar a equipe.' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const { nome, email, senha, role } = req.body ?? {};
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100 ||
      typeof email !== 'string' || email.trim().length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof senha !== 'string' || senha.length < 6 || Buffer.byteLength(senha, 'utf8') > 72 ||
      role !== undefined && role !== 'atendente') {
    res.status(400).json({ mensagem: 'Confira nome, e-mail e senha (entre 6 e 72 caracteres). A permissão deve ser Atendente.' });
    return;
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    // Revalida no banco: um JWT antigo de administrador não mantém o direito de criar usuários.
    const membro = await client.query('SELECT role FROM usuarios WHERE id=$1 AND loja_id=$2 FOR SHARE', [req.user!.id, req.user!.loja_id]);
    if (!membro.rowCount) {
      await client.query('ROLLBACK');
      res.status(401).json({ mensagem: 'Sua conta não pertence mais a esta loja. Entre novamente.' });
      return;
    }
    if (membro.rows[0].role !== 'admin') {
      await client.query('ROLLBACK');
      res.status(403).json({ mensagem: 'Somente administradores podem adicionar pessoas à equipe.' });
      return;
    }
    const hash = await bcrypt.hash(senha, 10);
    // Loja e permissão são definidas no servidor; não são aceitas da requisição.
    const result = await client.query(`INSERT INTO usuarios(loja_id,nome,email,senha,role)
      VALUES ($1,$2,$3,$4,'atendente') RETURNING id,nome,email,role,loja_id`,
      [req.user!.loja_id, nome.trim(), email.trim().toLowerCase(), hash]);
    const loja = await client.query('SELECT nome FROM lojas WHERE id=$1', [req.user!.loja_id]);
    await client.query('COMMIT');
    res.status(201).json({ ...result.rows[0], loja_nome: loja.rows[0].nome });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    const codigo = (error as { code?: string }).code;
    if (codigo === '23505') res.status(409).json({ mensagem: 'Este e-mail já possui cadastro.' });
    else res.status(500).json({ mensagem: 'Não foi possível criar o atendente.' });
  } finally { client?.release(); }
});

export default router;
