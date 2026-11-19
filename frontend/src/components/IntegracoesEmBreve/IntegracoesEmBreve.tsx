import '../IntegracaoNuvemshop/IntegracaoNuvemshop.css'
import './IntegracoesEmBreve.css'

interface Plataforma {
  nome: string
  descricao: string
  logo: string
  // ícone de aplicativo colorido que ocupa o tile inteiro (sem borda)
  cheia?: boolean
}

const PLATAFORMAS: Plataforma[] = [
  {
    nome: 'Bling',
    descricao: 'Pedidos e notas do seu ERP sincronizados com o pós-venda.',
    logo: '/integracoes/bling.png',
    cheia: true,
  },
  {
    nome: 'Mercado Livre',
    descricao: 'Vendas do marketplace acompanhadas automaticamente.',
    logo: '/integracoes/mercadolivre.png',
    cheia: true,
  },
  {
    nome: 'Shopee',
    descricao: 'Pedidos do marketplace direto na esteira de ocorrências.',
    logo: '/integracoes/shopee.svg',
  },
  {
    nome: 'Shopify',
    descricao: 'Importe os pedidos da sua loja Shopify sem planilhas.',
    logo: '/integracoes/shopify.svg',
  },
  {
    nome: 'Tray',
    descricao: 'Sua loja Tray conectada do pedido à resolução.',
    logo: '/integracoes/tray.png',
    cheia: true,
  },
  {
    nome: 'WooCommerce',
    descricao: 'A loja WordPress integrada ao acompanhamento de casos.',
    logo: '/integracoes/woocommerce.png',
  },
]

// vitrine das próximas integrações: apenas informativa, sem ação
function IntegracoesEmBreve() {
  return (
    <section aria-label="Próximas integrações">
      <h2 className="embreve-titulo">Próximas integrações</h2>
      <ul className="embreve-grade">
        {PLATAFORMAS.map((p) => (
          <li key={p.nome} className="embreve-card">
            <span className={`integracao-logo ${p.cheia ? 'integracao-logo-cheia' : ''}`} aria-hidden="true">
              <img src={p.logo} alt="" loading="lazy" />
            </span>
            <div className="embreve-dados">
              <strong>{p.nome}</strong>
              <p>{p.descricao}</p>
              <span className="embreve-badge">Disponível em breve</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default IntegracoesEmBreve
