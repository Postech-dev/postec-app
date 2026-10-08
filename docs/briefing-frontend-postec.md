# Briefing: frontend do PosTec (React + TSX)

Implemente o frontend do PosTec neste projeto, seguindo o design do Figma (arquivo "Postec-UPX"). O backend já existe em outra pasta; por enquanto o frontend roda com dados mockados e uma camada de serviço fácil de trocar pela API real.

## Estrutura obrigatória

- React + TypeScript (TSX), Vite, React Router.
- `src/components/`: cada componente numa pasta própria, com o `.tsx` e o `.css` lado a lado (ex.: `components/Button/Button.tsx` e `Button.css`).
- `src/pages/`: cada página monta a tela chamando components.
- `src/App.tsx`: só declara as rotas e chama as pages.
- Sem Tailwind, sem styled-components. O CSS de cada componente fica junto dele.
- Comentários curtos em `//` minúsculo. Sem JSDoc nos props.
- `src/types/` para os tipos (Ocorrencia, Pedido, Cliente, Loja, Usuario, Mensagem, StatusOcorrencia).
- `src/services/` com funções async que hoje devolvem os mocks de `src/mocks/`, para ligar na API depois sem mexer nas pages.

## Identidade visual

- Fonte: Montserrat.
- brand `#FF8104`, action `#AA4800`, ink `#232A34`, bg `#F7F8FA`, green `#237B57`, blue `#3267A8`.
- Logo: texto "PosTec" com ícone circular laranja; slogan "Tecnologia e praticidade para Pós Vendas."
- Visual limpo: fundo claro, cards brancos com borda sutil, laranja nos botões primários e destaques, avisos em caixa laranja clara.

## Fluxo da ocorrência (regra de negócio da interface)

Novo → Em triagem → Aguardando devolução (opcional) → Reenvio solicitado ou Estorno solicitado → Concluído.

- Reenvio exige novo código de rastreio e itens reenviados.
- Estorno exige valor e comprovante ou ID da transação.
- O cliente abre o caso e responde mensagens. A equipe da loja muda as etapas e registra a resolução.
- Só é possível concluir após registrar os dados da resolução.

## Layout das telas internas (lojista)

Todas as telas internas usam o mesmo shell:

- Sidebar: logo PosTec, "PÓS-VENDA EM ORDEM", seletor de loja ("Mariana Modas ⌄", "Plano Starter"), grupo "PRINCIPAL" com Ocorrências, Minhas lojas, Equipe e "Portal do cliente ↗". No rodapé, card "Tudo em um só lugar. Cada ocorrência, do início à resolução." e o usuário logado (avatar "MS", "Mariana Silva", "Administradora").
- Topbar: breadcrumb "Workspace / Mariana Modas" à esquerda e data "Terça-feira, 06 out. 2026 • MS" à direita.
- Item ativo da sidebar destacado em laranja.

## Telas e rotas

### Login (`/login`)
Painel laranja com card branco centralizado: "Bem-vindo!", "Acesse sua conta", campos "Insira seu email" e "Insira sua senha", botão "Entrar", links "Esqueci minha senha" e "Cadastrar-se". Logo PosTec com slogan ao lado.

### Ocorrências, tabela (`/ocorrencias`)
- Cabeçalho: "PAINEL DO LOJISTA", título "Seu pós-venda, sob controle.", subtítulo "Acompanhe os casos da sua loja e saiba o que precisa de atenção."
- 4 cards de resumo: Abertas (5, "Ocorrências em andamento"), Novas (1, "Aguardando triagem"), Aguardando devolução (1, "Acompanhar com o cliente"), Concluídas (1, "Neste período").
- Alternador Tabela / Kanban, busca "Protocolo, cliente ou pedido", filtro de status "Todos os status".
- Tabela: PROTOCOLO, CLIENTE, PEDIDO, MOTIVO, STATUS (badge), ABERTURA. Rodapé "6 ocorrências • Página 1 de 1" e paginação.
- Aviso laranja: "1 nova ocorrência precisa de triagem. Abra POS-1001 para começar o atendimento."
- Dados de exemplo:
  - POS-1001 Lucas Avaliador, PED-101, Produto com defeito, Novo, Hoje 10:30
  - POS-1002 Ana Costa, PED-102, Tamanho incorreto, Em triagem, Hoje 09:15
  - POS-1003 Julia Santos, PED-103, Arrependimento, Aguardando devolução, 05 out. 14:20
  - POS-1004 Pedro Lima, PED-104, Avaria, Reenvio solicitado, 05 out. 11:05
  - POS-1005 Carla Oliveira, PED-105, Arrependimento, Estorno solicitado, 04 out. 16:40
  - POS-1006 Beatriz Souza, PED-106, Atraso de entrega, Concluído, 04 out. 10:00

### Ocorrências, kanban (`/ocorrencias/kanban`)
- Eyebrow "OCORRÊNCIAS", título "Uma visão de cada etapa.", subtítulo "Abra um cartão para atender. As mudanças de etapa seguem o fluxo de resolução."
- Voltar para a tabela ("← Tabela", "6 ocorrências").
- 6 colunas (Novo, Em triagem, Aguardando devolução, Reenvio solicitado, Estorno solicitado, Concluído), cada uma com contador "1 ocorrência".
- Cartão: protocolo, cliente, motivo, pedido, data e botão "Ver caso".
- Rodapé com o fluxo: "Novo → Em triagem → Devolução (quando necessária) → Reenvio ou estorno → Concluído."

### Detalhe da ocorrência (`/ocorrencias/:protocolo`)
Link "← Voltar às ocorrências". Cabeçalho: "POS 1001 · PED 101", título com o motivo ("Produto com defeito"), "Aberta em 06 out. 2026, às 10:30 • Responsável: Mariana Silva", badge de status e "Cliente notificado por e-mail".

Coluna principal, "Histórico de mensagens": separador "Hoje, 06 de outubro", mensagens do cliente e da loja (nome • hora, com anexo "ziper-quebrado.jpg"), eventos do sistema em linha (ex.: "10:35 • Mariana iniciou a triagem"), campo "Mensagem para o cliente" ("Escreva sua resposta…"), botão "Enviar mensagem" e texto "O cliente acompanha pelo portal."

Coluna lateral: card do pedido (PED-101, "Vestido Midi Linho Cru • Tam. M", "Valor do pedido: R$ 189,90"), dados do cliente (Lucas Avaliador, lucas.avaliador@facens.br) e card de ação que muda conforme o status:

- Novo: título "Começar atendimento", botão "Assumir e iniciar triagem".
- Em triagem: título "Como vamos resolver?", botões "Solicitar devolução", "Solicitar reenvio", "Solicitar estorno".
- Aguardando devolução: título "Devolução recebida?", subtítulo "Após receber a peça, registre a resolução.", botões "Solicitar reenvio", "Solicitar estorno". Evento "10:45 • Devolução solicitada ao cliente".
- Todos: texto "Só é possível concluir após registrar os dados da resolução."

### Solicitar devolução (modal de confirmação)
Eyebrow "Confirmação", título "Solicitar devolução", texto "A ocorrência ficará em Aguardando devolução. Informe ao cliente como devolver o produto.", campo "Orientações de devolução *" com texto padrão "Embale a peça e siga as instruções enviadas pela loja.", botão "Confirmar solicitação".

### Mensagem enviada (modal)
"Mensagem enviada", "Sua resposta está disponível no histórico e no portal do cliente.", botão "Voltar ao atendimento".

### Registrar reenvio (`/ocorrencias/:protocolo/reenvio`)
"← Detalhe da ocorrência", "RESOLUÇÃO · POS 1001", título "Registrar reenvio", "Informe os itens e o rastreio do novo envio.", badge "Reenvio solicitado". Card "Dados do novo envio" com "Novo código de rastreio *" (ex.: AA987654321BR) e "Itens reenviados *" (ex.: "1 × Vestido Midi Linho Cru • Tam. M"), aviso "Confira o código de rastreio antes de concluir." Card lateral "Resumo do caso" (protocolo, cliente, pedido, motivo, produto, valor original R$ 189,90). Rodapé: "* Campos obrigatórios", "Ao confirmar, o caso será concluído e o cliente receberá os dados por e-mail.", botões "Cancelar" e "Confirmar reenvio e concluir".

### Registrar estorno (`/ocorrencias/:protocolo/estorno`)
Mesmo layout do reenvio. Título "Registrar estorno", "Registre o estorno realizado e compartilhe o comprovante.", badge "Estorno solicitado". Card "Dados do estorno": "Valor estornado *" (R$ 189,90), "ID da transação" (ex.: PIX 123456), upload "↑ Anexar comprovante *" ("PDF, JPG ou PNG • até 10 MB") com arquivo anexado (comprovante-pix.pdf, 240 KB, "Remover"). Botão "Confirmar estorno e concluir".

### Ocorrência concluída (modal)
"Concluído", "Ocorrência concluída", "Os dados da resolução foram registrados. O cliente será notificado por e-mail.", botão "Voltar à lista".

### Minhas lojas (`/lojas`)
Eyebrow "ADMINISTRAÇÃO", título "Minhas lojas", "Gerencie os dados e o portal de atendimento de cada loja.", botão "+ Cadastrar loja". Cards de loja com badge "Ativa", nome, "Plano Starter", "Portal do cliente" com URL (postec.app/portal/mariana-modas), botões "Editar", "Abrir portal", "Excluir". Lojas de exemplo: Mariana Modas e Ateliê Mariana.

### Editar loja (`/lojas/:id/editar`)
"← Minhas lojas", "DADOS DA LOJA", título "Editar Mariana Modas", "As informações abaixo identificam sua loja e o portal público." Campos: "Nome da loja *", "Slug do portal *", "E-mail de atendimento *". Aviso com "Portal: postec.app/portal/mariana-modas" e "Plano atual: Starter". Botões "Cancelar" e "Salvar alterações".

### Excluir loja (modal)
"Confirmação", "Excluir loja?", "Confira os dados da loja antes de continuar. Esta ação precisa ser confirmada por um administrador.", botões "Cancelar" e "Confirmar exclusão".

### Equipe (`/equipe`)
Eyebrow "ADMINISTRAÇÃO", título "Quem cuida do seu pós-venda.", "Administradores gerenciam a loja; atendentes acompanham e resolvem ocorrências." Lista: Mariana Silva (mariana@marianamodas.com.br, Administradora) e Paula Rocha (paula@marianamodas.com.br, Atendente). Card "Adicionar atendente": "Nome *", "E-mail *", "Senha inicial *", "Permissão: Atendente", botão "Criar usuário", nota "O usuário é criado diretamente pela administradora."

## Portal do cliente (sem sidebar, rota `/portal/:slug`)

Cabeçalho em todas as telas do portal: nome da loja ("Mariana Modas") e "Central de pós-venda • por PosTec". Layout estreito, centralizado, pensado para celular.

1. **Consulta (`/portal/:slug`)**: eyebrow "PORTAL DO CLIENTE", título "Vamos ajudar com seu pedido.", "Consulte sua compra para solicitar uma troca ou resolver um problema." Campos "Número do pedido *" (ex.: PED 101) e "CPF *" (000.000.000-00), botão "Consultar pedido", nota "Use os dados informados na compra." Abaixo, bloco "Já abriu uma ocorrência?" com campo "Protocolo" (ex.: POS-1001) e botão "Acompanhar ocorrência".
2. **Pedido encontrado**: "← Voltar", "PEDIDO ENCONTRADO", "Olá, Lucas!", "Encontramos sua compra na Mariana Modas." Card do pedido (PED-101, Vestido Midi Linho Cru, Tamanho M • 1 unidade, R$ 189,90, cliente e e-mail), botão "Preciso de ajuda com este pedido".
3. **Abrir ocorrência**: "← Meu pedido", título "Conte o que aconteceu.", "Sua mensagem será enviada à equipe da loja." Campos "Motivo *" (select: produto com defeito, arrependimento, tamanho incorreto, atraso de entrega), "Descrição *", upload opcional "↑ Adicionar foto ou evidência" ("Opcional • JPG, PNG ou PDF"), botão "Enviar solicitação".
4. **Solicitação recebida**: "ESTAMOS COM VOCÊ", "Tudo certo, Lucas.", "A equipe da Mariana Modas vai analisar o seu caso.", card "Seu protocolo" (POS 1001, badge Novo, pedido e motivo), texto sobre e-mail de confirmação, botões "Acompanhar minha ocorrência" e "Voltar ao início".
5. **Acompanhamento**: "POS 1001 · PED 101", "Seu caso está em andamento.", "Veja as atualizações e converse com a loja.", badge de status, linha do tempo ("✓ Solicitação recebida · 10:30", "● Em triagem · 10:35"), mensagens da loja, campo "Sua resposta" com botões "Responder" e "Anexar", link "Ver exemplo de caso concluído".
6. **Concluído**: "Concluído", "Sua nova peça está a caminho.", "Registramos o reenvio do seu pedido.", card com "Novo código de rastreio", item reenviado, "Concluído em 06 out. 2026", botões "Ver histórico da ocorrência" e "Consultar outro pedido".

## Regras de implementação

- Consulta de pedido por número do pedido + CPF, conforme o contrato de API.
- Upload de evidências, itens reenviados e mensagens do cliente existem no escopo; trate como mock até o contrato ser detalhado.
- Lojas e usuários adicionais são administrados por usuários autorizados; os dados devem ser isolados por loja.
- Planos Starter/Pro são apenas exibidos; cobrança não faz parte do MVP.
- A ação de excluir loja abre a confirmação, mas não apaga nada de verdade ainda.
- Os formulários validam campos obrigatórios (*) no front e mostram erro inline.

## Como trabalhar

1. Leia a estrutura atual do projeto e a stack antes de criar arquivos.
2. Monte primeiro os components base (Button, Input, Select, Badge de status, Card, Modal, Sidebar, Topbar, AppShell, PortalShell), depois as pages, depois as rotas no `App.tsx`.
3. Crie tipos e mocks com os dados de exemplo acima e consuma tudo via `services/`.
4. Ao final, rode o build e o lint e corrija os erros.
