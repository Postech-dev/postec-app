import PageHeader from '../components/PageHeader/PageHeader'
import PainelMetricas from '../components/PainelMetricas/PainelMetricas'
import PlanGate from '../components/PlanGate/PlanGate'
import './pages.css'

function MetricasPage() {
  return (
    <div className="pagina">
      <PageHeader
        eyebrow="ATENDIMENTO"
        titulo="Como está o seu pós-venda."
        subtitulo="Números simples para saber onde melhorar."
      />
      <PlanGate recurso="metricas">
        <PainelMetricas />
      </PlanGate>
    </div>
  )
}

export default MetricasPage
