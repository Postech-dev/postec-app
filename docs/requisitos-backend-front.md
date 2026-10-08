# Requisitos para o backend (vindos do frontend)

Este documento junta o que o frontend já assume e o backend precisa entregar.
No código, cada ponto também tem um comentário `// backend:` no service correspondente (`frontend/src/services/`).

## 1. Segurança (obrigatório, não é "nice to have")

### 1.1 Acesso por protocolo permite ler o caso de outro cliente
O protocolo é sequencial (`POS-1001`, `POS-1002`...), então dá para enumerar.
Hoje o mock devolve o caso só com o protocolo. No backend:

- `GET /portal/:slug/ocorrencias/:protocolo` deve exigir **protocolo + CPF** do cliente da ocorrência, ou
- aceitar **somente o token** do link do e-mail (item 2) e remover o acesso só por protocolo.

Sem isso, qualquer pessoa percorre os protocolos e lê mensagens, nome e e-mail de outros clientes.
Também vale limitar tentativas (rate limit por IP) na consulta de pedido (número + CPF) e na de protocolo.

### 1.2 O plano precisa ser verificado no servidor (`requirePlan`)
O cadeado do frontend (`PlanGate`, `BotaoPlano`, itens bloqueados da sidebar) é **só visual**.
Quem bloqueia de verdade é o backend. Cada rota de recurso pago precisa de um middleware
`requirePlan('<plano mínimo>')` que lê o plano da loja do usuário autenticado e responde `403`:

| Recurso | Plano mínimo | Rotas |
| --- | --- | --- |
| Pedidos por CSV e cadastro manual | starter | `POST /pedidos`, `POST /pedidos/importacoes` |
| Integração Nuvemshop | pro | `GET/POST/DELETE /integracoes/nuvemshop` |
| Abrir ocorrência pelo lojista (CRM) | business | `POST /painel/ocorrencias` |
| Ficha do cliente | business | `GET /clientes/:id` |
| Métricas | business | `GET /metricas` |

O plano da loja vem do servidor (campo `plano` da loja), nunca do cliente.
O seletor de plano do frontend (`?demo=1` ou `VITE_DEMO=true`) existe só para demonstração e deve ficar desligado em produção real.

### 1.3 Isolamento por loja
Todas as consultas filtram pela loja do usuário logado (pedidos, clientes, ocorrências, métricas, integrações).
No portal, a loja vem do `slug`, e o pedido/ocorrência precisa pertencer a essa loja.

### 1.4 Notas internas
Mensagens com `interna = true` **nunca** são devolvidas nas rotas do portal (`/portal/...`).
O frontend já não as pede, mas não pode ser a única barreira.

## 2. Link de acompanhamento no e-mail (token)

- Rota do front: `/portal/:slug/caso/:token` (já existe). A rota por protocolo (`/portal/:slug/acompanhar/:protocolo`) continua para quem consulta com número do pedido + CPF.
- O token é **aleatório** (≥ 128 bits), guardado com validade (mock: 30 dias) e ligado a uma ocorrência.
- `GET /portal/:slug/caso/:token` (público): `404` se não existir, `410` se expirado, `200` com a ocorrência e as mensagens (sem notas internas).
- O e-mail de confirmação (abertura pelo portal) e o e-mail do contato aberto pelo lojista devem levar esse link.
- Reenviar o link gera token novo e pode invalidar o anterior.

## 3. Pedidos e importação por CSV

- `GET /pedidos?busca=&pagina=`: lista da loja, com **total de ocorrências** por pedido. A busca aceita número, nome e CPF.
- `POST /pedidos`: cadastro manual. `409` se o número já existir na loja. Valida CPF (dígitos verificadores), e-mail e valor.
- `POST /pedidos/importacoes` (multipart, até 5 MB, só `.csv`):
  - chave de upsert: **(loja, número do pedido)**. Importar o mesmo arquivo de novo atualiza, não duplica.
  - o cliente é identificado pelo **CPF**; mesmo CPF atualiza nome e e-mail do cliente (decisão do front, confirmar com o negócio).
  - valida tudo de novo e devolve `{ novos, atualizados, erros: [{ linha, mensagem }] }`; linhas com erro não impedem as válidas.
  - opcional: `?simular=true` para a prévia vir do servidor (hoje a prévia é calculada no front, e o servidor só diz quais números já existem).
- Regras que o front aplica na prévia (o backend deve repetir):
  - colunas: `numero_pedido, cliente_nome, cliente_email, cliente_cpf, produto, tamanho, quantidade, valor, data_pedido` (`tamanho` é opcional).
  - valor: se tem vírgula, a vírgula é o decimal e os pontos são milhar (`1.234,56`); só com ponto, o ponto é o decimal (`189.90`).
  - data: apenas `DD/MM/AAAA` ou `AAAA-MM-DD`, nunca formato americano.
  - CPF: com dígitos verificadores; guardar só dígitos.
  - separador `;` ou `,`; codificação UTF-8 ou Windows-1252 (o front já converte para UTF-8 antes de enviar).
- Consulta do portal (`POST /portal/:slug/consultar-pedido`): número do pedido normalizado (`ped 101` → `PED-101`) + CPF só com dígitos.

## 4. Ocorrência aberta pelo lojista (`POST /painel/ocorrencias`, Business)

- Entrada: pedido, motivo, canal de origem, relato, primeira mensagem.
- Canais: `portal`, `telefone`, `instagram`, `loja_fisica`, `reclame_aqui`, `email`, `outro` (`portal` é automático nas ocorrências abertas pelo cliente).
- Cria a ocorrência já em **Em triagem** (a loja já está atendendo), com:
  - evento do sistema "Ocorrência aberta pela loja • Canal: X";
  - o relato como **nota interna**;
  - a primeira mensagem para o cliente;
  - token do link (item 2) e envio do e-mail ao cliente.
- A listagem de ocorrências devolve `canal` e aceita filtro por canal.

## 5. Ficha do cliente e métricas (Business)

- `GET /clientes/:id`: cliente, pedidos, ocorrências, `totalPedidos`, `totalOcorrencias`, `ultimaInteracao` (última mensagem ou evento).
- `GET /metricas`:
  - `abertas`: ocorrências com status diferente de Concluído;
  - `tempoMedioPrimeiraResposta`: média em minutos entre a abertura e a primeira mensagem da loja ao cliente (nota interna não conta; casos abertos pela loja ficam de fora);
  - `taxaResolucao`: concluídas ÷ total;
  - `porMotivo` e `porCanal`: contagem agrupada.

## 6. Integração Nuvemshop (Pro/Business)

- `GET /integracoes/nuvemshop`: `{ conectada, conectadaEm }`.
- Conectar: iniciar o OAuth da Nuvemshop, guardar o token da loja e receber o callback; depois importar pedidos automaticamente (webhooks).
- Desconectar: revogar o token e parar os webhooks.
- Hoje a tela só simula a conexão.

## 7. Já pedido antes (continua pendente)

- **Contagens do painel:** `GET /painel/contagens` → `{ novas, naoLidas }`; marcar como lida ao abrir o caso (`marcarComoLida`). Guardar "não lida" por mensagem.
- **Atualização do histórico:** hoje o front faz polling de 10 s (`observarMensagens`). Trocar por `GET /mensagens?desde=<último id>` ou SSE/WebSocket.
- **Convite de atendente:** criar o usuário sem senha, gerar token de uso único (ex.: 48 h) e enviar link `/primeiro-acesso?token=...`; substitui a senha inicial definida pela administradora (`convidarAtendente`, `definirSenhaPrimeiroAcesso`).
- **Anexos:** hoje só o nome do arquivo é guardado; falta upload real (tipos JPG, PNG e PDF, até 10 MB).
