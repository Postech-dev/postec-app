# Sistema de Gestão de Ocorrências Postec

Este projeto é uma aplicação web desenvolvida para auxiliar lojistas na gestão de ocorrências relacionadas a vendas e entregas.

## 📋 Funcionalidades

### Para Lojistas (Painel de Controle)
- **Autenticação:** Login seguro com e-mail e senha.
- **Gestão de Lojas:** CRUD completo para cadastro e gerenciamento de lojas.
- **Gestão de Ocorrências:**
  - Visualização de todas as ocorrências com status.
  - Detalhes da ocorrência com histórico de mensagens (timeline).
  - Atualização de status (Triagem, Aguardando Devolução, Reenvio Solicitado, Estorno Solicitado, Concluído).
  - Resolução de ocorrências com:
    - **Reenvio:** Inserção de código de rastreio.
    - **Estorno:** Inserção de valor e upload de comprovante.
  - Comunicação direta com o cliente via chat.

### Para Clientes (Portal)
- **Consulta de Pedidos:** Busca de pedidos por número e CPF.
- **Abertura de Ocorrências:** Solicitação de suporte com descrição do problema.
- **Acompanhamento:** Visualização do status e histórico de mensagens da ocorrência aberta.

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js com TypeScript
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (JSON Web Tokens)
- **Validação:** Zod

## 📂 Estrutura do Projeto

```
postec-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── node_modules/
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
└── frontend/          # (Se aplicável, não descrito neste arquivo)
```

### Descrição das Pastas do Backend:
- **config/**: Configurações do projeto (banco de dados, variáveis de ambiente).
- **controllers/**: Funções que tratam a lógica de negócio e respostas HTTP.
- **middlewares/**: Funções intermediárias como autenticação e validação.
- **models/**: Definições de tipos e interfaces para as entidades do sistema.
- **routes/**: Definição das rotas da API.
- **services/**: Lógica reutilizável, como envio de e-mails.
- **utils/**: Funções utilitárias (bcrypt, JWT, validação).

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js (14.0 ou superior)
- PostgreSQL (12.0 ou superior)

### Instalação
1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd postec-app
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o ambiente:
   - Crie um arquivo `.env` na raiz do backend:
     ```bash
     cp .env.example .env
     ```
   - Edite o arquivo `.env` com suas credenciais de banco de dados e chaves da API.

4. Suba o banco e carregue o seed:
   ```bash
   # Sobe o PostgreSQL via Docker (schema aplicado automaticamente)
   docker-compose up -d

   # Carrega os dados de demonstração (garante UTF-8 correto no Windows)
   node backend/database/seed.js
   ```

### Execução
Para iniciar o servidor em modo de desenvolvimento:
```bash
npm run dev
```

## 🔧 Rotas da API

### Lojas
- `GET /api/lojas`: Listar todas as lojas.
- `POST /api/lojas`: Criar nova loja (Admin).
- `PUT /api/lojas/:id`: Atualizar loja (Admin).
- `DELETE /api/lojas/:id`: Deletar loja (Admin).

### Autenticação
- `POST /api/auth/login`: Login de usuário.
- `POST /api/auth/register-admin`: Registrar admin inicial.
- `POST /api/auth/register-loja`: Registrar loja inicial.

### Portal do Cliente
- `POST /api/portal/ocorrencias`: Abrir nova ocorrência.
- `POST /api/portal/pedidos/consultar`: Consultar pedido (com slug na URL).
- `GET /api/portal/ocorrencias/:protocolo`: Consultar status da ocorrência.

### Painel do Lojista
- `GET /api/painel/ocorrencias`: Listar ocorrências da loja.
- `GET /api/painel/ocorrencias/:id`: Detalhes da ocorrência.
- `PATCH /api/painel/ocorrencias/:id/status`: Atualizar status.
- `POST /api/painel/ocorrencias/:id/resolver`: Resolver ocorrência.
- `POST /api/painel/ocorrencias/:id/mensagens`: Enviar mensagem.