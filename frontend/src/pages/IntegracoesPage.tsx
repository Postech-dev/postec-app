import IntegracaoNuvemshop from '../components/IntegracaoNuvemshop/IntegracaoNuvemshop'
import IntegracoesEmBreve from '../components/IntegracoesEmBreve/IntegracoesEmBreve'
import PageHeader from '../components/PageHeader/PageHeader'
import PlanGate from '../components/PlanGate/PlanGate'
import './pages.css'

function IntegracoesPage() {
  return (
    <div className="pagina">
      <PageHeader
        eyebrow="Configuração"
        titulo="Integrações"
        subtitulo="Conecte a plataforma da sua loja para os pedidos chegarem sozinhos"
      />
      <PlanGate recurso="integracao">
        <IntegracaoNuvemshop />
        <IntegracoesEmBreve />
      </PlanGate>
    </div>
  )
}

export default IntegracoesPage
