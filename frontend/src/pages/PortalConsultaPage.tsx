import PageHeader from '../components/PageHeader/PageHeader'
import PortalConsulta from '../components/PortalConsulta/PortalConsulta'

function PortalConsultaPage() {
  return (
    <>
      <PageHeader
        eyebrow="PORTAL DO CLIENTE"
        titulo="Vamos ajudar com seu pedido."
        subtitulo="Consulte sua compra para solicitar uma troca ou resolver um problema."
      />
      <PortalConsulta />
    </>
  )
}

export default PortalConsultaPage
