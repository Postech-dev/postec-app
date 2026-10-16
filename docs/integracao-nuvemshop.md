# Integração Nuvemshop — implementação local

O Postec reutiliza seu painel, login, backend Express e PostgreSQL. A conexão e a lista de pedidos passam a utilizar a API do Postec. A configuração de um túnel público e a instalação na loja demo ficam para a próxima etapa.

## O que está implementado

- Autorização OAuth iniciada por administrador de uma loja Pro/Business.
- `state` aleatório, com validade de dez minutos, uso único e vínculo com cookie HttpOnly do navegador.
- Token da loja criptografado com AES-256-GCM. O token e o Client Secret não são enviados ao frontend.
- Uma conta Nuvemshop por loja Postec; a mesma conta externa não pode ser capturada por outra loja.
- Importação inicial dos últimos 90 dias em páginas e janelas de sete dias.
- Pedidos e itens persistidos, com IDs externos preservados como texto e atualização sem duplicação.
- Separação dos estados de pedido, pagamento e envio do estado da ocorrência.
- Recebimento de webhooks com verificação HMAC-SHA256 sobre os bytes originais.
- Fila persistente no PostgreSQL, repetição de falhas temporárias e reconciliação periódica.
- Tratamento de suspensão, retomada e desinstalação. Desconectar no Postec cancela as tarefas e remove o token local.
- Interface com estado da conexão, pedidos importados, fila, última atualização, falhas e ações de reconexão/sincronização/desconexão.
- Listagem e detalhe de pedidos reais, origem Nuvemshop, moeda e itens. Cadastro manual e CSV persistem na mesma base sem sobrescrever pedidos externos.
- Abertura de contato pelo painel Business persistida no banco, inclusive para pedidos importados.

## Preparar o ambiente sem ngrok

Requisitos: Node.js 22 ou superior, npm e PostgreSQL. O Docker é usado pelos testes de integração.

1. Copie `backend/.env.example` para `backend/.env` e preencha a conexão local com o PostgreSQL.
2. Defina um `JWT_SECRET` privado para o ambiente.
3. Para o frontend, copie `frontend/.env.example` para `frontend/.env.local`, se precisar ajustar o proxy.
4. Se estiver criando um banco novo, aplique `backend/database/db.sql`. O Docker Compose do projeto aplica esse arquivo ao inicializar um volume novo. **Não rode seeds sobre uma base que precise preservar.**
5. No diretório `backend`, execute:

```bash
npm ci
npm run migrate
npm run dev
```

6. Em outro terminal, no diretório `frontend`, execute:

```bash
npm ci
npm run dev
```

O backend usa a porta `3333` por padrão; o frontend usa `5173` e encaminha `/api` para o backend. As migrações acrescentam estruturas ao schema existente e podem ser reexecutadas. Elas não importam vendas nem alteram os planos das lojas.

Sem credenciais Nuvemshop, o painel mostra a integração em preparação e bloqueia o botão de conexão. Isso permite testar a plataforma antes de configurar o serviço externo.

## Variáveis para conectar depois

| Variável no backend | Conteúdo |
| --- | --- |
| `APP_PUBLIC_URL` | Origem do frontend acessível pelo navegador e pela Nuvemshop; por enquanto `http://localhost:5173` |
| `NUVEMSHOP_APP_ID` | `46963`, aplicativo criado no Portal de Parceiros |
| `NUVEMSHOP_CLIENT_SECRET` | Credencial privada obtida no Portal de Parceiros |
| `NUVEMSHOP_USER_AGENT` | Nome do app e contato real, por exemplo `Postec (suporte@seu-dominio)` |
| `INTEGRATION_ENCRYPTION_KEY` | Chave privada de 32 bytes em Base64 |

Gerar a chave de criptografia uma vez:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Guarde essa chave junto à configuração privada do ambiente. Trocar a chave impede descriptografar os tokens existentes; nesse caso será necessário reconectar as lojas. Os arquivos privados `.env` do backend e `.env.local` do frontend são ignorados pelo Git.

## Etapa posterior: ngrok e Nuvemshop

Com frontend e backend rodando:

```bash
ngrok http 5173
```

Depois de obter a URL HTTPS, configure:

| Local | Valor |
| --- | --- |
| Backend: `APP_PUBLIC_URL` | Origem HTTPS fornecida pelo ngrok |
| Frontend: `VITE_ALLOWED_HOST` | Apenas o hostname exato do ngrok, sem protocolo ou caminho |
| Nuvemshop: site do aplicativo | A mesma origem HTTPS |
| Nuvemshop: redirecionamento após instalação | `{APP_PUBLIC_URL}/api/integracoes/nuvemshop/callback` |
| Tipo do app | Externo; opção de incorporar ao administrador desmarcada |
| Permissão mínima | `read_orders` |

Reinicie os servidores depois de alterar o ambiente. O cookie de autorização é criado na origem do Postec: **abra o painel pela URL do ngrok antes de clicar em Conectar Nuvemshop**. Iniciar em localhost e receber o callback em outro domínio perde o vínculo do navegador.

Crie uma loja demo, entre no Postec como administrador de loja Pro/Business e inicie a instalação pelo botão do Postec. O callback precisa de um `state` emitido por essa ação; acessar diretamente “Instalar aplicativo” no Portal de Parceiros sem iniciar no Postec não conclui o vínculo.

O backend registra os webhooks operacionais em `{APP_PUBLIC_URL}/api/integracoes/nuvemshop/webhook`. O registro é repetível. Se o hostname do túnel mudar, atualize os dois ambientes e o callback no Portal de Parceiros, reinicie e use “Sincronizar agora” para registrar a nova URL. Webhooks antigos podem ser removidos pelo gerenciamento da Nuvemshop; reenvios não duplicam os pedidos.

## Rotas

| Método e rota | Acesso | Função |
| --- | --- | --- |
| `GET /api/integracoes/nuvemshop` | Loja Pro/Business autenticada | Status sem credenciais |
| `POST /api/integracoes/nuvemshop/conectar` | Administrador Pro/Business | URL de autorização e cookie de vínculo |
| `GET /api/integracoes/nuvemshop/callback` | Estado/cookie válidos | Conclui autorização e agenda importação |
| `POST /api/integracoes/nuvemshop/sincronizar` | Administrador Pro/Business | Repetir falhas, reconciliar e registrar webhooks |
| `DELETE /api/integracoes/nuvemshop` | Administrador Pro/Business | Encerra o acesso local; preserva pedidos |
| `POST /api/integracoes/nuvemshop/webhook` | Assinatura HMAC válida | Persiste eventos na fila |
| `GET /api/pedidos` e `GET /api/pedidos/:id` | Loja autenticada | Consulta de pedidos da própria loja |
| `POST /api/pedidos` | Loja autenticada | Cadastro manual |
| `POST /api/pedidos/importacoes` | Loja autenticada | Importação JSON das linhas do CSV validadas novamente no servidor |

A importação manual usa uma transação por arquivo: se houver erro ou colisão com pedido externo, todo o lote é revertido e a interface informa a falha. Não sobrescreve pedidos sincronizados pela Nuvemshop.

## Como a sincronização funciona

O worker roda junto ao processo do backend e consulta a fila a cada dois segundos. Os trabalhos ficam no PostgreSQL e sobrevivem ao reinício do processo. Uma tarefa em execução sem conclusão pode ser recuperada depois de dez minutos.

As falhas temporárias recebem novas tentativas com espera crescente, até cinco execuções. Erros de autenticação, permissão ou suspensão aguardam intervenção. “Sincronizar agora” permite repetir tarefas que falharam; “Reconectar” é necessário quando a autorização deixou de funcionar.

Cada conexão possui uma geração. Desconectar ou reconectar muda essa geração, impedindo trabalhos antigos de gravarem pedidos na nova instalação. Locks por conexão evitam processamento concorrente do mesmo canal. O checkpoint de reconciliação é separado da última atualização de um pedido para não perder alterações de outros pedidos.

Uma reconciliação é agendada quando o checkpoint tem mais de uma hora, com sobreposição de cinco minutos. Intervalos de criação são usados no histórico; intervalos de atualização são usados depois. Se o backend ficar desligado, os eventos e consultas pendentes só serão processados quando ele voltar.

## Validação

No diretório `backend`:

```bash
npm run build
npm test
npm run test:integration
```

O último comando cria um PostgreSQL descartável, com porta local aleatória, e remove o container ao terminar. Não usa o banco configurado no `.env`. A API externa é simulada: não precisa de chave real e não instala o app em nenhuma loja.

Os testes cobrem autorização, papéis/planos, proteção contra replay, criptografia, assinatura do webhook, IDs grandes, múltiplos itens, dados ausentes, separação de lojas, atualizações antigas, repetição sem duplicar, retomada após 429 e desconexão. O fluxo de cadastro/CSV também é validado com PostgreSQL real.

No diretório `frontend`, `npm run build` verifica os tipos e gera o build. O lint geral ainda pode apresentar problemas anteriores à integração em outros componentes; os arquivos alterados devem ser verificados separadamente.

## Limites antes de produção

- Falta executar a instalação e a importação contra a API real usando a loja demo. Essa etapa depende das credenciais e da URL HTTPS.
- Os webhooks obrigatórios de privacidade (`app/store_redact`, `customer/redact`, `customers/data_request`) e seus procedimentos de exclusão/relatório ainda precisam ser implementados e configurados antes de usar dados reais de consumidores ou publicar o app. O webhook operacional não finge cumprir essas solicitações.
- O portal atual exige CPF. Pedidos sem CPF são importados e ficam disponíveis no painel; é necessário definir outro mecanismo de verificação para autoatendimento nesses casos.
- A ficha agrupa pedidos apenas por CPF válido, sem criar uma tabela de identidades externas de clientes. Sem CPF, mantém o pedido de referência isolado.
- Uma loja Postec só pode reconectar a mesma conta Nuvemshop. Trocar de conta, importar várias contas e consolidar a mesma venda de plataformas diferentes precisam de fluxos próprios.
- A API da listagem retorna todos os pedidos da loja ao frontend, seguindo a interface atual. Paginação no servidor e controle fino de prioridade/volume são próximos passos para bases grandes.
- Abrir contato no painel salva a ocorrência e as mensagens no banco; o envio de convite ao comprador e links autenticados de acompanhamento continuam como evolução do fluxo de CRM.
- Cancelamentos e estornos são lidos da Nuvemshop. A integração não executa operações financeiras nem altera estoque.

## Documentação oficial utilizada

- [Autenticação e permissões](https://nuvemshop.dev/api/authentication).
- [Pedidos — API estável 2025-03](https://nuvemshop.dev/api/resources/2025-03/order).
- [Webhooks e assinatura](https://nuvemshop.dev/api/resources/2025-03/webhook).
- [Requisições e limites](https://nuvemshop.dev/api/getting-started).
