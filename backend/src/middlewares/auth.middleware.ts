import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  id: number;
  nome: string;
  email: string;
  role: string;
  loja_id: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ mensagem: 'Token de autenticação não fornecido' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ mensagem: 'Formato de token inválido. Use: Bearer <token>' });
    return;
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'postec-secret-key-facens';

  try {
    const decoded = jwt.verify(token, secret) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ mensagem: 'Token inválido ou expirado' });
  }
}
