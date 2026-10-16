// Fonte editorial: Documentacao_PosTec_ProjectOne.docx, fornecida pelo usuário.
// O documento descreve uma proposta/MVP: integrações e preços não são ofertas ativas.
export const site = {
  name: 'PosTec',
  title: 'PosTec | Seu pós-venda, do problema à solução',
  description: 'Conheça a PosTec: uma plataforma em desenvolvimento para centralizar pedidos, devoluções, atendimento, reenvios e estornos de pequenos e-commerces.',
  draft: false,
  url: 'https://landing-page-delta-umber-19.vercel.app',
  contactUrl: 'mailto:suporte@postec.com?subject=Quero%20conhecer%20a%20PosTec',
  integrations: ['Yampi', 'Reportana', 'bling', 'shopify', 'nuvemshop', 'WhatsApp'],
  plans: [
    { name: 'Starter', price: '149', audience: 'O primeiro passo para organizar seu pós-venda.', tag: 'Para começar' },
    { name: 'Pro', price: '399', audience: 'Uma nova fase para a operação da sua loja.', tag: 'Para crescer' },
    { name: 'Business', price: '899', audience: 'O próximo capítulo do seu pós-venda.', tag: 'Para expandir' },
  ],
  faq: [
    { question: 'O que é a PosTec?', answer: 'É uma proposta de plataforma SaaS para centralizar o pós-venda de pequenos e-commerces. A ideia é reunir pedidos, ocorrências, atendimento, reenvios, estornos e acompanhamento logístico em um único ambiente.' },
    { question: 'Para quem a plataforma está sendo criada?', answer: 'Para pequenos e-commerces e lojas em crescimento que têm equipes reduzidas e precisam acompanhar devoluções, avarias e outros problemas sem depender de informações espalhadas entre várias ferramentas.' },
    { question: 'A PosTec já está disponível para contratação?', answer: 'Ainda não. O projeto está em desenvolvimento e validação do MVP. A demonstração desta página usa dados fictícios para apresentar o fluxo proposto; ela não está conectada a uma loja real.' },
    { question: 'Quais integrações estão previstas?', answer: 'O projeto prevê integrações com Yampi, Reportana, Bling, Shopify e Nuvemshop, além do WhatsApp e de informações de transportadoras. A disponibilidade e o escopo de cada conexão serão definidos durante o desenvolvimento.' },
    { question: 'Vou precisar trocar as ferramentas que já uso?', answer: 'A proposta é conectar as ferramentas que sua loja já utiliza, sem exigir sua substituição imediata. A compatibilidade dependerá das integrações disponíveis na versão lançada.' },
    { question: 'Os valores dos planos já são definitivos?', answer: 'Não. Starter a R$ 149/mês, Pro a R$ 399/mês e Business a R$ 899/mês são os valores previstos no planejamento inicial. Preços, limites e funcionalidades de cada plano serão confirmados após a validação do produto.' },
  ],
};
