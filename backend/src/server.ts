import express from 'express';
import dotenv from 'dotenv';
import lojasRoutes from './routes/lojas.routes';
import authRoutes from './routes/auth.routes';
import portalRoutes from './routes/portal.routes';
import painelRoutes from './routes/painel.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
