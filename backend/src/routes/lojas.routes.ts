import { Router } from 'express';
import {
  getLojas,
  getLojaById,
  postLojas,
  putLojas,
  deleteLojas
} from '../controllers/lojas.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Rotas REST padronizadas, todas com login (antes qualquer pessoa podia editar ou apagar lojas)
router.get('/lojas', authMiddleware, getLojas);
router.get('/lojas/:id', authMiddleware, getLojaById);
router.post('/lojas', authMiddleware, postLojas);
router.put('/lojas/:id', authMiddleware, putLojas);
router.delete('/lojas/:id', authMiddleware, deleteLojas);

export default router;
