import { Router } from 'express';
import {
  listarOcorrencias,
  detalharOcorrencia,
  atualizarStatus,
  resolverOcorrencia,
  enviarMensagem
} from '../controllers/painel.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas do painel exigem autenticação do lojista
router.use(authMiddleware);

// Listar todas as ocorrências da loja
router.get('/ocorrencias', listarOcorrencias);

// Detalhar uma ocorrência específica com timeline de mensagens
router.get('/ocorrencias/:id', detalharOcorrencia);

// Atualizar status do chamado (Triagem, Aguardando Devolução, etc)
router.patch('/ocorrencias/:id/status', atualizarStatus);

// Resolver ocorrência com Reenvio (rastreio) ou Estorno (valor + comprovante)
router.post('/ocorrencias/:id/resolver', resolverOcorrencia);

// Enviar mensagem de resposta no ticket
router.post('/ocorrencias/:id/mensagens', enviarMensagem);

export default router;
