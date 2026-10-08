import IntegracaoNuvemshop from '../components/IntegracaoNuvemshop/IntegracaoNuvemshop'
import PageHeader from '../components/PageHeader/PageHeader'
import PlanGate from '../components/PlanGate/PlanGate'
import './pages.css'

function IntegracoesPage() {
  return (
    <div className="pagina">
      <PageHeader
        eyebrow="CONFIGURAÇÃO"
        titulo="Integrações"
        subtitulo="Conecte a plataforma da sua loja para os pedidos chegarem sozinhos."
      />
      <PlanGate recurso="integracao">
        <IntegracaoNuvemshop />
      </PlanGate>
    </div>
  )
}

export default IntegracoesPage
