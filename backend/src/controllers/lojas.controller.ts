import { type Response } from 'express';
import pool from '../database';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// todas as rotas exigem login e só enxergam a loja do usuário logado
// (o plano só muda no servidor; não é editável por aqui)

const CAMPOS = `id, nome, slug, email, plano, prazo_resposta_dias, endereco_devolucao`;

function soAdmin(req: AuthenticatedRequest, res: Response): boolean {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ mensagem: 'Só administradores podem fazer isso' });
    return false;
  }
  return true;
}

// Lista as lojas do usuário (hoje, uma)
export async function getLojas(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await pool.query(`SELECT ${CAMPOS} FROM lojas WHERE id = $1`, [req.user?.loja_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ mensagem: 'Erro interno ao buscar lojas' });
  }
}

// Buscar uma loja específica pelo ID (só a própria)
export async function getLojaById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT ${CAMPOS} FROM lojas WHERE id = $1 AND id = $2`, [id, req.user?.loja_id]);

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

// Criar uma nova loja (administradores)
export async function postLojas(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!soAdmin(req, res)) return;
    const { nome, slug, email } = req.body;

    if (!nome || !slug || !email) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nome, slug e email' });
      return;
    }

    const query = `
      INSERT INTO lojas (nome, slug, email, plano)
      VALUES ($1, $2, $3, 'starter')
      RETURNING ${CAMPOS}
    `;
    const result = await pool.query(query, [nome, slug, email]);

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

// Atualizar a própria loja (administradores)
export async function putLojas(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!soAdmin(req, res)) return;
    const { id } = req.params;
    const { nome, slug, email, prazo_resposta_dias, endereco_devolucao } = req.body;

    if (prazo_resposta_dias !== undefined) {
      const prazo = Number(prazo_resposta_dias);
      if (!Number.isInteger(prazo) || prazo < 1 || prazo > 30) {
        res.status(400).json({ mensagem: 'O prazo de resposta deve ser um número de dias entre 1 e 30' });
        return;
      }
    }

    const query = `
      UPDATE lojas
      SET nome = COALESCE($1, nome),
          slug = COALESCE($2, slug),
          email = COALESCE($3, email),
          prazo_resposta_dias = COALESCE($4, prazo_resposta_dias),
          endereco_devolucao = COALESCE($5, endereco_devolucao)
      WHERE id = $6 AND id = $7
      RETURNING ${CAMPOS}
    `;
    const values = [
      nome ?? null,
      slug ?? null,
      email ?? null,
      prazo_resposta_dias ?? null,
      endereco_devolucao ?? null,
      id,
      req.user?.loja_id
    ];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Loja não encontrada para atualização' });
      return;
    }

    res.status(200).json({ mensagem: 'Loja atualizada com sucesso', loja: result.rows[0] });
  } catch (error: any) {
    console.error('Erro ao atualizar loja:', error);
    if (error.code === '23505') {
      res.status(400).json({ mensagem: 'Já existe uma loja com esse endereço de portal. Escolha outro.' });
      return;
    }
    res.status(500).json({ mensagem: 'Erro interno ao atualizar loja' });
  }
}

// Deletar a própria loja (administradores)
export async function deleteLojas(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!soAdmin(req, res)) return;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM lojas WHERE id = $1 AND id = $2 RETURNING id, nome', [id, req.user?.loja_id]);

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
