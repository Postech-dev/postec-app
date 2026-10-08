import type { Pedido } from '../../types'
import { formatarMoeda, tamanhoCurto } from '../../utils/format'
import Card from '../Card/Card'
import './PedidoCard.css'

interface PedidoCardProps {
  pedido: Pedido
  // loja mostra o valor do pedido; portal mostra também os dados do cliente
  variante: 'loja' | 'portal'
}

function PedidoCard({ pedido, variante }: PedidoCardProps) {
  if (variante === 'loja') {
    return (
      <Card titulo="Pedido">
        <div className="pedido">
          <strong className="pedido-numero">{pedido.numero}</strong>
          <span>
            {pedido.produto} • {tamanhoCurto(pedido.detalhe)}
          </span>
          <span className="pedido-valor">Valor do pedido: {formatarMoeda(pedido.valor)}</span>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="pedido">
        <strong className="pedido-numero">{pedido.numero}</strong>
        <span className="pedido-produto">{pedido.produto}</span>
        <span className="pedido-valor">{pedido.detalhe}</span>
        <strong className="pedido-preco">{formatarMoeda(pedido.valor)}</strong>
        <hr />
        <span>{pedido.cliente.nome}</span>
        <span className="pedido-valor">{pedido.cliente.email}</span>
      </div>
    </Card>
  )
}

export default PedidoCard
