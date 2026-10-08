import express from 'express';
import dotenv from 'dotenv';
import lojasRoutes from './routes/lojas.routes';
import authRoutes from './routes/auth.routes';
import portalRoutes from './routes/portal.routes';
import painelRoutes from './routes/painel.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

app.use(express.json());

// Rota raiz para conferir status da API
app.get('/', (req, res) => {
  res.json({ mensagem: 'API PosTec funcionando com sucesso! 🚀' });
});

// Registra as rotas da aplicação com prefixo /api
app.use('/api', lojasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/painel', painelRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando com sucesso na porta ${port}`);
});
