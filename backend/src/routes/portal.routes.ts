import { Router } from 'express';
import {
  getLoja,
  consultarPedido,
  abrirOcorrencia,
  getStatusOcorrencia,
  responderOcorrencia
} from '../controllers/portal.controller';

const router = Router();

// Dados públicos da loja (nome, prazo de resposta, endereço de devolução)
router.get('/:slug', getLoja);

// Consultar pedido pelo slug da loja, número do pedido e CPF
router.post('/:slug/consultar-pedido', consultarPedido);

// Abrir nova ocorrência no portal do cliente
router.post('/:slug/ocorrencias', abrirOcorrencia);

// Consultar status e mensagens pelo protocolo da ocorrência
router.get('/:slug/ocorrencias/:protocolo', getStatusOcorrencia);

// O cliente responde à loja
router.post('/:slug/ocorrencias/:protocolo/mensagens', responderOcorrencia);

export default router;
