import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database';

function gerarToken(user: { id: number; nome: string; email: string; role: string; loja_id: number }): string {
  const secret = process.env.JWT_SECRET || 'postec-secret-key-facens';
  const payload = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    loja_id: user.loja_id
  };
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios' });
      return;
    }

    const query = `
      SELECT u.id, u.loja_id, u.nome, u.email, u.senha, u.role,
             l.nome AS loja_nome, l.slug AS loja_slug, l.plano AS loja_plano
      FROM usuarios u
      JOIN lojas l ON l.id = u.loja_id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      res.status(401).json({ mensagem: 'E-mail ou senha inválidos' });
      return;
    }

    const user = result.rows[0];

    // Suporta tanto senha em texto plano (para seed rápido/testes) quanto hash bcrypt
    let passwordMatch = false;
    if (user.senha.startsWith('$2a$') || user.senha.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(senha, user.senha);
    } else {
      passwordMatch = senha === user.senha;
    }

    if (!passwordMatch) {
      res.status(401).json({ mensagem: 'E-mail ou senha inválidos' });
      return;
    }

    res.status(200).json({
      token: gerarToken(user),
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        loja_id: user.loja_id,
        loja_nome: user.loja_nome,
        loja_slug: user.loja_slug,
        // o plano vem sempre do servidor; o front só exibe
        loja_plano: String(user.loja_plano || 'starter').toLowerCase()
      }
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ mensagem: 'Erro interno ao realizar login' });
  }
}

// "Ateliê da Ana" -> "atelie-da-ana"
function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Cria a loja (plano starter) e a primeira usuária, que é administradora
export async function cadastro(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const { nome, loja, email, senha } = req.body;

    if (!nome || !loja || !email || !senha) {
      res.status(400).json({ mensagem: 'Nome, loja, e-mail e senha são obrigatórios' });
      return;
    }
    if (String(senha).length < 6) {
      res.status(400).json({ mensagem: 'A senha precisa ter pelo menos 6 caracteres' });
      return;
    }

    const existente = await client.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      res.status(409).json({ mensagem: 'Este e-mail já tem cadastro. Entre com ele ou use outro e-mail.' });
      return;
    }

    await client.query('BEGIN');

    // slug único: se já existir, acrescenta -2, -3...
    const base = gerarSlug(String(loja)) || 'loja';
    let slug = base;
    for (let i = 2; ; i++) {
      const usado = await client.query('SELECT 1 FROM lojas WHERE slug = $1', [slug]);
      if (usado.rows.length === 0) break;
      slug = `${base}-${i}`;
    }

    const lojaResult = await client.query(
      `INSERT INTO lojas (nome, slug, email, plano) VALUES ($1, $2, $3, 'starter') RETURNING id, nome, slug, plano`,
      [loja, slug, email]
    );
    const novaLoja = lojaResult.rows[0];

    const hash = await bcrypt.hash(String(senha), 10);
    const userResult = await client.query(
      `INSERT INTO usuarios (loja_id, nome, email, senha, role) VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, loja_id, nome, email, role`,
      [novaLoja.id, nome, email, hash]
    );
    const user = userResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      token: gerarToken(user),
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        loja_id: novaLoja.id,
        loja_nome: novaLoja.nome,
        loja_slug: novaLoja.slug,
        loja_plano: 'starter'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar:', error);
    res.status(500).json({ mensagem: 'Erro interno ao cadastrar' });
  } finally {
    client.release();
  }
}
