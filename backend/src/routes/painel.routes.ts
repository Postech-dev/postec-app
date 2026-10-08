import { Router } from 'express';
import {
  listarOcorrencias,
  contagens,
  detalharOcorrencia,
  marcarLida,
  atualizarStatus,
  resolverOcorrencia,
  enviarMensagem
} from '../controllers/painel.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas do painel exigem autenticação do lojista
router.use(authMiddleware);

// Números do menu (novas e não lidas)
router.get('/contagens', contagens);

// Listar todas as ocorrências da loja
router.get('/ocorrencias', listarOcorrencias);

// Detalhar uma ocorrência (por id ou protocolo) com timeline de mensagens
router.get('/ocorrencias/:id', detalharOcorrencia);

// Marcar a ocorrência como lida
router.post('/ocorrencias/:id/lida', marcarLida);

// Atualizar status do chamado (Triagem, Aguardando Devolução, etc)
router.patch('/ocorrencias/:id/status', atualizarStatus);

// Resolver ocorrência com Reenvio (rastreio) ou Estorno (valor + comprovante)
router.post('/ocorrencias/:id/resolver', resolverOcorrencia);

// Enviar mensagem de resposta (ou nota interna) no ticket
router.post('/ocorrencias/:id/mensagens', enviarMensagem);

export default router;
