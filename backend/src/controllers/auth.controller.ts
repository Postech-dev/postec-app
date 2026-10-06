import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios' });
      return;
    }

    const query = `
      SELECT u.id, u.loja_id, u.nome, u.email, u.senha, u.role, l.nome AS loja_nome
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

    const secret = process.env.JWT_SECRET || 'postec-secret-key-facens';
    const payload = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      loja_id: user.loja_id
    };

    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    res.status(200).json({
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        role: user.role,
        loja_id: user.loja_id,
        loja_nome: user.loja_nome
      }
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ mensagem: 'Erro interno ao realizar login' });
  }
}
