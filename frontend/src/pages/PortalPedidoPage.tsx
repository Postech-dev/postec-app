import { Navigate, useLocation, useOutletContext, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink/BackLink'
import Button from '../components/Button/Button'
import PageHeader from '../components/PageHeader/PageHeader'
import PedidoCard from '../components/PedidoCard/PedidoCard'
import type { Pedido, PortalContexto } from '../types'
import './portal.css'

function PortalPedidoPage() {
  const { slug = '' } = useParams()
  const { loja } = useOutletContext<PortalContexto>()
  const pedido = (useLocation().state as { pedido?: Pedido } | null)?.pedido

  // sem pedido consultado, volta para a consulta
  if (!pedido) return <Navigate to={`/portal/${slug}`} replace />

  return (
    <>
      <BackLink to={`/portal/${slug}`}>Voltar</BackLink>
      <PageHeader
        eyebrow="PEDIDO ENCONTRADO"
        titulo={`Olá, ${pedido.cliente.nome.split(' ')[0]}!`}
        subtitulo={`Encontramos sua compra na ${loja.nome}.`}
      />
      <PedidoCard pedido={pedido} variante="portal" />
      <Button bloco to={`/portal/${slug}/abrir`} state={{ pedido }}>
        Preciso de ajuda com este pedido
      </Button>
    </>
  )
}

export default PortalPedidoPage
