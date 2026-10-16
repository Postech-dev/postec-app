# Estudo de integração de vendas: Nuvemshop, Mercado Livre e Shopee

**Projeto:** Postec

**Data:** 15 de outubro de 2026

**Status:** estudo técnico; nenhuma integração implementada

**Base:** código da branch `dev` e documentação oficial consultada em 14 e 15 de outubro de 2026.

## 1. Recomendação

Para o estado atual do Postec, a ordem recomendada é **Nuvemshop → Mercado Livre → Shopee**.

A Nuvemshop oferece o caminho mais simples para um primeiro piloto. O Mercado Livre exige mais trabalho para relacionar ordens, carrinhos, pagamentos e entregas. A Shopee acrescenta dificuldades de categoria do aplicativo, liberação para produção e disponibilidade dos dados do comprador.

Essa classificação é uma avaliação técnica para o Postec, não uma medição de mercado. Se os primeiros clientes venderem principalmente na Shopee ou no Mercado Livre, a demanda comercial pode justificar outra ordem.

| Critério | Nuvemshop | Mercado Livre | Shopee |
| --- | --- | --- | --- |
| Facilidade relativa | Mais simples | Intermediária | Mais trabalhosa |
| Esforço total no Postec | Médio | Médio a alto | Alto |
| Conexão da conta | OAuth, autorizado pelo lojista | OAuth, autorizado pelo vendedor | Autorização da loja e chamadas assinadas |
| Credenciais | Token sem expiração por tempo, sujeito a invalidação | Token de 6 horas e renovação com rotação do refresh token | Token de 4 horas e renovação |
| Atualizações | Webhooks de pedidos | Notificações de vendas e envios | Push Mechanism |
| Maior dificuldade | Construir a base de sincronização | Relacionamentos e diferenças entre recursos | Permissões e dados pessoais mascarados |
| Compatibilidade com o portal atual por CPF | Maior, mas depende do dado recebido | Exige validação e adaptação | Exige adaptação importante |
| Prioridade sugerida | 1ª | 2ª | 3ª |

As características das APIs estão detalhadas e referenciadas nas seções seguintes. “Mais simples” não significa apenas ligar o botão que já existe: a infraestrutura de importação ainda precisa ser construída.

## 2. Escopo e limites do estudo

O objetivo é trazer vendas de contas autorizadas para o Postec, permitindo consultar pedidos e vincular ocorrências de pós-venda.

O primeiro escopo recomendado inclui identificadores, itens, quantidades, valores, moeda, datas, estados do pedido e dados do comprador que possam ser legitimamente acessados. O acompanhamento detalhado de entrega pode ser acrescentado conforme a necessidade do piloto.

Ficam para estudos posteriores: publicar anúncios, sincronizar estoque, emitir notas fiscais, enviar mensagens pelos marketplaces, executar cancelamentos, realizar estornos e operar devoluções. Importar uma venda não concede automaticamente todas essas capacidades.

Não foram criados aplicativos, conectadas contas ou feitas chamadas autenticadas. Aprovação de produção, permissões efetivamente concedidas e qualidade dos dados precisam ser verificadas com lojas de teste e um piloto autorizado.

## 3. O que precisa mudar no Postec

Os seguintes pontos foram constatados no repositório:

| Situação atual | Evidência | Consequência |
| --- | --- | --- |
| Conexão Nuvemshop simulada em memória | [Serviço de integrações](../frontend/src/services/integracoes.service.ts) | Faltam autorização real, armazenamento de credenciais e sincronização |
| Serviço de pedidos usa mocks | [Serviço de pedidos](../frontend/src/services/pedidos.service.ts) | A listagem precisa consumir os pedidos persistidos no backend |
| Banco exige CPF e e-mail | [Tabela de pedidos](../backend/database/db.sql) | Dados ausentes ou mascarados não cabem adequadamente no modelo |
| Pedido tem um campo de texto para produto | [Tabela de pedidos](../backend/database/db.sql) | É necessário representar vários itens por pedido |
| Importação simulada identifica pedido pelo número | [Serviço de pedidos](../frontend/src/services/pedidos.service.ts) | Números iguais em plataformas ou contas diferentes podem colidir |
| Portal consulta por número e CPF | [Controller do portal](../backend/src/controllers/portal.controller.ts) | Pedidos sem CPF disponível não podem usar esse fluxo |

Também é necessário separar a **origem da venda** do **canal de atendimento**. Uma venda pode vir do Mercado Livre e a ocorrência ser registrada por telefone.

## 4. Nuvemshop

### Como integrar

1. Cadastrar o Postec no Portal de Parceiros e criar um aplicativo.
2. Configurar callback e permissões mínimas: `read_orders`; acrescentar `read_customers` se o objeto de cliente for necessário.
3. O lojista autoriza a instalação. O backend troca o código recebido por token e ID da loja.
4. Consultar os pedidos de um período inicial, com paginação.
5. Registrar webhooks e atualizar os pedidos conforme os eventos recebidos.

O OAuth utiliza o fluxo de código de autorização. O token não expira por tempo, mas pode ser invalidado por nova emissão para o mesmo par app/loja ou desinstalação. A conexão deve ficar associada à loja correta no backend. [Autenticação oficial](https://nuvemshop.dev/api/authentication).

Para um piloto com lojistas selecionados, a modalidade **“Para Seus Clientes”** dispensa a homologação da Loja de Aplicativos. Distribuição pública segue outro processo. Uma integração que utiliza somente a API não depende do NubeSDK destinado a scripts na loja. [Criação e distribuição de aplicativos](https://nuvemshop.dev/apps/admin/overview).

### Recursos principais

Na versão estável consultada, a base brasileira é `https://api.nuvemshop.com.br/2025-03/{store_id}`.

| Recurso | Uso |
| --- | --- |
| `GET /orders` | Listar pedidos por período e percorrer páginas |
| `GET /orders/{id}` | Consultar um pedido |
| `/webhooks` | Registrar notificações |

O pedido contém itens, totais, dados de contato e estados de pagamento e envio. Guardar o `id` técnico e o `number` exibido ao cliente em campos separados. O objeto `customer` depende de `read_customers`. [Pedidos](https://nuvemshop.dev/api/resources/2025-03/order).

Eventos como `order/created`, `order/paid`, `order/updated` e `order/cancelled` permitem acompanhar o ciclo da venda. Webhooks têm assinatura verificável, e a documentação prevê eventos de privacidade que precisam ser tratados. [Webhooks](https://nuvemshop.dev/api/resources/2025-03/webhook).

### Dificuldades e como lidar

| Dificuldade | Tratamento proposto |
| --- | --- |
| Limites de requisições | Controlar chamadas por loja, respeitar cabeçalhos e repetir depois de erros temporários |
| Histórico grande | Dividir consultas por datas e salvar o progresso da importação |
| Eventos repetidos ou fora de ordem | Atualizar o mesmo pedido sem duplicar e conferir a versão mais recente na API |
| Desinstalação ou acesso suspenso | Interromper tarefas da conexão e mostrar o estado ao lojista |
| Documento ou contato ausente | Importar com os campos disponíveis e sinalizar a limitação do portal |

O limite padrão documentado é de 2 requisições por segundo por loja/aplicativo, com capacidade de rajada de 40 e condições diferentes em planos superiores. A documentação também descreve indisponibilidade da API por falta de pagamento. [Uso da API](https://nuvemshop.dev/api/getting-started).

**Avaliação:** melhor primeira integração. O acesso é relativamente simples e há um caminho de distribuição privada para validar o produto antes de uma publicação pública.

## 5. Mercado Livre

### Como integrar

1. Criar o aplicativo e configurar callback, permissões funcionais e acesso offline necessários.
2. Redirecionar o vendedor para autorizar o Postec.
3. Guardar vendedor, token, refresh token e expiração no backend.
4. Buscar vendas por vendedor e período; consultar detalhes e agrupamentos necessários.
5. Receber notificações e reconciliar alterações periodicamente.

O token dura seis horas. A renovação devolve um novo refresh token, de uso único. Como decisão de implementação, a renovação deve ter um bloqueio por conexão e gravação atômica das novas credenciais: dois processos não devem tentar usar o mesmo refresh token ao mesmo tempo. [Autenticação oficial](https://developers.mercadolivre.com.br/pt_br/gerenciamento-perguntas-respostas/autenticacao-e-autorizacao).

### Recursos principais

| Recurso | Uso |
| --- | --- |
| `GET /orders/search?seller={seller_id}` | Localizar vendas do vendedor |
| `GET /orders/{order_id}` | Obter os dados da ordem |
| Recurso `/packs` | Entender agrupamentos de carrinho |
| Recursos de envios | Complementar entrega quando necessário |

Uma compra pode envolver várias ordens agrupadas em um pack. Precisamos preservar essa relação e evitar contabilizar o agrupamento e suas ordens como vendas independentes. A documentação informa histórico de ordens de até 12 meses; não prometer importação ilimitada. [Gerenciamento de vendas](https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas).

Para atualizações, utilizar `orders_v2` e, se necessário, `shipments`. A orientação oficial é responder HTTP 200 em até 500 ms; a consulta e o processamento devem acontecer depois, por fila. [Notificações](https://developers.mercadolivre.com.br/produto-receba-notificacoes).

### Dificuldades e como lidar

| Dificuldade | Tratamento proposto |
| --- | --- |
| Ordens, packs e entregas relacionados | Manter IDs e vínculos próprios, sem achatar tudo em uma linha |
| Renovação concorrente de tokens | Centralizar a renovação e persistir a rotação com segurança |
| Dados parciais do comprador | Aceitar ausências e validar quais dados o app pode acessar e utilizar |
| Total vendido diferente do repasse | Separar total do pedido, frete, descontos, taxas e valores financeiros disponíveis |
| Cancelamentos e estornos posteriores | Atualizar vendas existentes; não importar apenas pedidos recém-criados |
| Evolução dos contratos de envio | Validar a documentação vigente antes de implementar detalhes logísticos |

Dados fiscais têm um recurso específico para faturamento. A existência desse acesso não deve ser interpretada como liberação automática para identificar clientes no portal de suporte. O desenho inicial deve funcionar sem depender desse recurso. [Dados de faturamento](https://developers.mercadolivre.com.br/pt_br/faturamento).

**Avaliação:** boa segunda integração. O trabalho adicional está principalmente na modelagem e nas regras de sincronização; não exige trocar a stack do Postec.

## 6. Shopee

### Como integrar

1. Criar conta de desenvolvedor e validar a categoria adequada para o aplicativo Postec.
2. Configurar ambientes, callback e chaves; realizar testes e solicitar liberação para produção.
3. Obter a autorização da loja e armazenar suas credenciais.
4. Assinar as chamadas e importar as páginas de pedidos.
5. Consultar detalhes, ativar Push Mechanism e reconciliar atualizações.

A categoria do app determina as APIs disponíveis. O guia brasileiro informa que não é possível alterá-la depois nem adicionar permissões extras manualmente. Portanto, o enquadramento de um SaaS de pós-venda deve ser validado antes de criar o app definitivo. [Criação do aplicativo](https://open.shopee.com/developer-guide/740).

### Recursos e particularidades

| Recurso | Uso |
| --- | --- |
| `GET /api/v2/order/get_order_list` | Listar identificadores de pedidos |
| `GET /api/v2/order/get_order_detail` | Buscar itens, valores e outros dados solicitados |
| Push Mechanism | Receber mudanças de status |

A listagem usa cursor, aceita até 100 registros por página e exige intervalos de até **15 dias por consulta**. Esse é o tamanho da janela de busca, não uma afirmação de que todo o histórico se limita a 15 dias. As chamadas usam assinatura HMAC-SHA256; o token tem validade de quatro horas. [Referência da listagem](https://open.shopee.com/documents/v2/v2.order.get_order_list?module=94&type=1).

O detalhamento recebe até 50 identificadores por chamada e possui campos opcionais que precisam ser solicitados. A estratégia deve buscar apenas os dados necessários ao Postec. [Detalhes do pedido](https://open.shopee.com/documents/v2/v2.order.get_order_detail?module=94&type=1).

O guia brasileiro documenta identificação de novas vendas pela listagem ou por Push Mechanism. [Fluxo de pedidos](https://open.shopee.com/developer-guide/383).

### Dificuldades e como lidar

| Dificuldade | Tratamento proposto |
| --- | --- |
| Escolha de categoria e liberação de produção | Confirmar elegibilidade, APIs e requisitos antes de assumir compromisso de entrega |
| Assinatura e credenciais distintas por ambiente | Isolar Sandbox/produção e manter relógio do servidor sincronizado |
| Renovação de tokens | Implementar o fluxo oficial e tratar revogação ou necessidade de reconexão |
| Histórico dividido em janelas e cursores | Persistir cada etapa para retomar após falhas |
| Dados sensíveis mascarados | Permitir pedido com dados incompletos e adaptar a experiência de atendimento |
| Exigência de IPs declarados para dados sensíveis | Validar a saída de rede da hospedagem e a configuração no app |

O guia de dados sensíveis informa que dados do comprador são liberados conforme necessidade logística/fiscal, status da venda e tipo de vendedor. Algumas informações são mascaradas ou não retornadas. Isso impede depender de CPF ou e-mail sempre disponíveis, principalmente ao importar vendas já concluídas. [Dados sensíveis](https://open.shopee.com/developer-guide/743).

**Avaliação:** terceira opção para o cenário atual. A viabilidade de importar pedidos é documentada; a compatibilidade com o portal atual e a liberação adequada ao Postec ainda precisam de validação prática.

As páginas oficiais da Shopee foram lidas pelo navegador em 14/10/2026; a consulta automatizada a algumas dessas URLs retornou bloqueio em 15/10/2026. Os links foram mantidos para conferência pela equipe.

## 7. Arquitetura proposta

Esta seção é uma proposta, sem implementação ou migração de banco neste estudo.

Manter Node.js, TypeScript, Express e PostgreSQL. Cada conector traduz a API externa para um modelo comum de pedidos; a aplicação não deve espalhar campos específicos de cada marketplace pelas telas.

```text
Lojista autoriza a conta
         |
         v
Conexão associada à loja do Postec
         |
         +--> Importação inicial --> páginas e progresso salvo
         |
         +--> Webhook/push --> recebimento persistido --> fila
                                                        |
                                                        v
                                              Consulta à API externa
                                                        |
                                                        v
                                              Pedido e itens no banco

Rotina periódica --> confere mudanças e recupera falhas
```

Uma fila persistente no PostgreSQL pode atender um piloto pequeno. Adotar Redis ou outro serviço depende do volume e da operação; não é pré-requisito para iniciar.

### Modelo mínimo sugerido

| Entidade | Dados necessários |
| --- | --- |
| Conexão | Loja interna, plataforma, conta externa, credenciais criptografadas, permissões, expiração e estado |
| Pedido | ID interno, conexão, ID externo como texto, número visível, moeda, totais, datas e estados |
| Item | Pedido, identificador externo, descrição, SKU/variação quando disponível, quantidade e preço |
| Identidade externa do comprador | Plataforma/conta, ID do comprador e dados de contato disponíveis |
| Sincronização | Cursor ou período, última execução, progresso, erro e próxima tentativa |
| Evento recebido | Conexão, identificador ou chave de deduplicação, recebimento e processamento |

No primeiro momento, CPF e e-mail ausentes não devem impedir a importação. Não preencher com dados fictícios nem unir compradores automaticamente por nome ou CPF mascarado.

### Regras de consistência

- Usar uma chave única como `(loja_id, plataforma, conta_externa_id, pedido_externo_id)` para repetir importações sem duplicar.
- Guardar IDs externos como texto, preservando formatos e evitando perda de precisão numérica em JavaScript.
- Separar estado do pedido, pagamento, entrega e ocorrência. Uma atualização externa não deve encerrar um atendimento por acidente.
- Manter data de atualização externa e conferir o estado atual quando eventos chegarem atrasados.
- Guardar valores monetários como decimal ou centavos; distinguir total do pedido, pago pelo comprador e recebido pelo vendedor.
- Preservar histórico de ocorrências quando uma venda for cancelada ou alterada.
- Verificar assinaturas quando oferecidas; validar conta, aplicativo e recurso antes de consultar a API com as credenciais correspondentes. Não acessar URLs arbitrárias recebidas em eventos.
- Tratar 401/403 como problemas de acesso, 429 como limitação de chamadas e 5xx como falhas temporárias, conforme o contrato de cada API.
- Aplicar permissões por loja também nas importações e nos processos em segundo plano.

A chave única resolve reenvios pelo mesmo conector. **Ela não resolve a mesma venda recebida por conectores diferentes.** A Nuvemshop documenta pedidos com origem `meli`; se a loja também conectar o Mercado Livre, será necessário definir qual fonte importa essas vendas ou relacioná-las por referência comprovada. Não deduplicar apenas por data, CPF e valor. [Origem do pedido na Nuvemshop](https://nuvemshop.dev/api/resources/2025-03/order).

## 8. Impacto no portal do cliente

Hoje o Postec exige número do pedido e CPF. A importação de vendas e o acesso ao portal precisam ser tratados como capacidades distintas.

Um pedido sem CPF pode aparecer no painel autenticado da loja e servir de contexto para uma ocorrência registrada pela equipe. Para acesso do comprador, será necessário validar um contato disponível ou outro mecanismo de verificação compatível com a plataforma.

Não liberar acesso somente pelo número do pedido. Quando não houver dados suficientes para verificar o comprador, manter o atendimento pelo canal autorizado e permitir gestão interna no Postec. Essa decisão deve ser validada no piloto, especialmente na Shopee.

## 9. Sequência de implementação futura

| Etapa | Entrega | Condição para avançar |
| --- | --- | --- |
| 1. Base comum | Pedidos reais no backend, itens, conexões, fila e chave única | Importação repetida não duplica e lojas permanecem isoladas |
| 2. Piloto Nuvemshop | Autorização, histórico configurável, webhooks e reconciliação | Vendas novas e alteradas aparecem corretamente |
| 3. Mercado Livre | Renovação de tokens, ordens/packs e notificações | Agrupamentos e valores não são contados duas vezes |
| 4. Validação Shopee | Categoria, Sandbox, produção e dados de uma loja autorizada | Permissões e acesso aos dados atendem ao uso previsto |
| 5. Conector Shopee | Janelas, detalhes em lote, renovação e push | Importação funciona mesmo com dados mascarados |

Sugestão para o piloto: período inicial de 90 dias, ajustável após validar volume e disponibilidade do canal. Esse período é uma escolha de produto, não um limite comum às APIs.

A interface deve mostrar conexão, período importado, quantidade de pedidos, última sincronização, falhas e necessidade de reconectar. A disponibilidade por plano deve ser validada no backend, não apenas escondida na interface.

## 10. Dificuldades, custos e pendências para decidir

O maior esforço inicial será construir a base comum do Postec. Depois, parte dela será reaproveitada nos demais conectores. Não há fundamento neste estudo para fixar preço, prazo de aprovação ou prometer gratuidade integral das integrações.

Os custos a dimensionar são desenvolvimento, processamento em segundo plano, banco, hospedagem, monitoramento e manutenção diante de mudanças nas APIs. Condições comerciais e eventuais serviços intermediários precisam ser confirmados separadamente.

Antes de estimar uma entrega, levantar:

1. Quantas lojas e contas por plataforma serão conectadas?
2. Qual o volume mensal e o pico de pedidos?
3. Qual histórico inicial e frequência de atualização são necessários?
4. O objetivo é consultar vendas no painel ou também oferecer autoatendimento ao comprador?
5. Quais permissões e categorias serão aprovadas para o aplicativo?
6. Quais dados retornam em pedidos pagos, enviados, concluídos e cancelados nas lojas do piloto?
7. A hospedagem suporta processos em segundo plano e, quando exigido, saída de rede com IP declarado?

**Decisão sugerida:** começar com uma loja Nuvemshop e validar a importação ponta a ponta. Expandir para Mercado Livre após estabilizar a base. Para Shopee, confirmar elegibilidade e dados disponíveis antes de assumir prazo comercial.

## 11. Validação necessária antes de produção

- Conectar, desconectar e reconectar a conta correta.
- Importar um pedido com vários itens e preservar valores e quantidades.
- Repetir importação e evento sem duplicar.
- Separar pedidos de contas diferentes com números iguais.
- Processar pagamento, cancelamento e atualização posteriores à importação.
- Importar dados ausentes ou mascarados sem criar identidades falsas.
- Retomar uma importação interrompida sem perder páginas.
- Recuperar falhas temporárias e respeitar limites de chamadas.
- Tratar expiração de token e rotação concorrente das credenciais.
- Garantir que uma loja nunca acesse pedidos ou credenciais de outra.

Esses são critérios propostos para uma implementação futura. Nenhum deles foi executado como teste de integração neste estudo.
