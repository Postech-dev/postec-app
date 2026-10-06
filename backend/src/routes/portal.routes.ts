import { Router } from 'express';
import {
  consultarPedido,
  abrirOcorrencia,
  getStatusOcorrencia
} from '../controllers/portal.controller';

const router = Router();

// Consultar pedido pelo slug da loja, número do pedido e CPF
router.post('/:slug/consultar-pedido', consultarPedido);

// Abrir nova ocorrência no portal do cliente
router.post('/:slug/ocorrencias', abrirOcorrencia);

// Consultar status e mensagens pelo protocolo da ocorrência
router.get('/:slug/ocorrencias/:protocolo', getStatusOcorrencia);

export default router;
