import express from 'express';
import { internalRoutes } from './routes/internal.routes';
import lojasRoutes from './routes/lojas.routes';
import authRoutes from './routes/auth.routes';
import equipeRoutes from './routes/equipe.routes';
import portalRoutes from './routes/portal.routes';
import painelRoutes from './routes/painel.routes';
import pedidosRoutes from './routes/pedidos.routes';
import { nuvemshopRoutes, nuvemshopPublicRoutes, erroIntegracao } from './integracoes/nuvemshop/routes';

export const app = express();

// origens do front liberadas (em desenvolvimento o proxy do Vite já evita CORS)
const origensPermitidas = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173').split(',');

app.use((req, res, next) => {
  const origem = req.headers.origin;
  if (origem && origensPermitidas.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Webhooks precisam do corpo bruto para conferir a assinatura.
app.use('/api/integracoes/nuvemshop', nuvemshopPublicRoutes);
app.use(express.json({ limit: '5mb' }));

// Rota raiz para conferir status da API
app.get('/', (req, res) => {
  res.json({ mensagem: 'API PosTec funcionando com sucesso! 🚀' });
});

// Registra as rotas da aplicação com prefixo /api
app.use('/api', internalRoutes);
app.use('/api', lojasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/painel', painelRoutes);

app.use('/api/pedidos', pedidosRoutes);
app.use('/api/integracoes/nuvemshop', nuvemshopRoutes);
app.use(erroIntegracao);
