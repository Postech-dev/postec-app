import { Router } from 'express';
import {
  getLojas,
  getLojaById,
  postLojas,
  putLojas,
  deleteLojas
} from '../controllers/lojas.controller';

const router = Router();

// Rotas REST padronizadas
router.get('/lojas', getLojas);
router.get('/lojas/:id', getLojaById);
router.post('/lojas', postLojas);
router.put('/lojas/:id', putLojas);
router.delete('/lojas/:id', deleteLojas);

export default router;