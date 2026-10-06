import { type Request, type Response } from 'express';
import pool from '../database';
import { lojas } from '../models/lojas';

// Listar todas as lojas
export async function getLojas(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM lojas ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ mensagem: 'Erro interno ao buscar lojas' });
  }
}

// Buscar uma loja específica pelo ID
export async function getLojaById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM lojas WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Loja não encontrada' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    res.status(500).json({ mensagem: 'Erro interno ao buscar loja' });
  }
}

// Criar uma nova loja
export async function postLojas(req: Request, res: Response): Promise<void> {
  try {
    const { nome, slug, email, plano } = req.body as Partial<lojas>;

    if (!nome || !slug || !email) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nome, slug e email' });
      return;
    }

    const query = `
      INSERT INTO lojas (nome, slug, email, plano)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [nome, slug, email, plano || 'Starter'];
    const result = await pool.query(query, values);

    res.status(201).json({ mensagem: 'Loja criada com sucesso', loja: result.rows[0] });
  } catch (error: any) {
    console.error('Erro ao criar loja:', error);
    if (error.code === '23505') {
      res.status(400).json({ mensagem: 'Já existe uma loja cadastrada com esse slug' });
      return;
    }
    res.status(500).json({ mensagem: 'Erro interno ao criar loja' });
  }
}

// Atualizar loja pelo ID
export async function putLojas(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nome, slug, email, plano } = req.body as Partial<lojas>;

    const query = `
      UPDATE lojas
      SET nome = COALESCE($1, nome),
          slug = COALESCE($2, slug),
          email = COALESCE($3, email),
          plano = COALESCE($4, plano)
      WHERE id = $5
      RETURNING *
    `;
    const values = [nome, slug, email, plano, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Loja não encontrada para atualização' });
      return;
    }

    res.status(200).json({ mensagem: 'Loja atualizada com sucesso', loja: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    res.status(500).json({ mensagem: 'Erro interno ao atualizar loja' });
  }
}

// Deletar loja pelo ID
export async function deleteLojas(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM lojas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Loja não encontrada para exclusão' });
      return;
    }

    res.status(200).json({ mensagem: 'Loja deletada com sucesso', loja: result.rows[0] });
  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    res.status(500).json({ mensagem: 'Erro interno ao deletar loja' });
  }
}