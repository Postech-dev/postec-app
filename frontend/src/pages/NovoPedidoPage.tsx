import { useNavigate } from 'react-router-dom'
import BackLink from '../components/BackLink/BackLink'
import PageHeader from '../components/PageHeader/PageHeader'
import PedidoForm from '../components/PedidoForm/PedidoForm'
import { useToast } from '../hooks/useToast'
import { cadastrarPedido } from '../services/pedidos.service'
import './pages.css'

function NovoPedidoPage() {
  const navigate = useNavigate()
  const { mostrar } = useToast()

  return (
    <div className="pagina">
      <BackLink to="/pedidos">Pedidos</BackLink>
      <PageHeader
        eyebrow="PEDIDOS"
        titulo="Cadastrar pedido"
        subtitulo="Use para pedidos avulsos. Para vários de uma vez, importe um CSV."
      />
      <PedidoForm
        onSalvar={async (dados) => {
          const pedido = await cadastrarPedido(dados)
          mostrar(`Pedido ${pedido.numero} cadastrado.`)
          navigate('/pedidos')
        }}
      />
    </div>
  )
}

export default NovoPedidoPage
