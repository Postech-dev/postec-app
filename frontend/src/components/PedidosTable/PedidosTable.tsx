import { Link, useNavigate } from 'react-router-dom'
import type { PedidoListado } from '../../types'
import { mascararCpf } from '../../utils/cpf'
import { formatarData, formatarMoeda } from '../../utils/format'
import BotaoPlano from '../BotaoPlano/BotaoPlano'
import Paginacao from '../Paginacao/Paginacao'
import '../OcorrenciaTable/OcorrenciaTable.css'
import './PedidosTable.css'

interface PedidosTableProps {
  pedidos: PedidoListado[]
  pagina: number
  porPagina: number
  onPagina: (pagina: number) => void
  // ficha do cliente (Business) ou detalhe do pedido
  destino: (pedido: PedidoListado) => string
}

function PedidosTable({ pedidos, pagina, porPagina, onPagina, destino }: PedidosTableProps) {
  const navigate = useNavigate()
  const visiveis = pedidos.slice((pagina - 1) * porPagina, pagina * porPagina)

  return (
    <div className="otabela">
      <div className="otabela-rolagem">
        <table className="pedidos-tabela">
          <thead>
            <tr>
              <th scope="col">PEDIDO</th>
              <th scope="col">CLIENTE</th>
              <th scope="col">CPF</th>
              <th scope="col">PRODUTO</th>
              <th scope="col">VALOR</th>
              <th scope="col">DATA</th>
              <th scope="col">OCORRÊNCIAS</th>
              <th scope="col">
                <span className="so-leitor">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p) => (
              <tr key={p.id} onClick={() => navigate(destino(p))}>
                <td>
                  <Link to={destino(p)} className="otabela-protocolo">
                    {p.numero}
                  </Link>
                </td>
                <td>{p.cliente.nome}</td>
                <td>{mascararCpf(p.cliente.cpf)}</td>
                <td>{p.produto}</td>
                <td>{formatarMoeda(p.valor)}</td>
                <td>{formatarData(p.dataPedido)}</td>
                <td>{p.totalOcorrencias}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <BotaoPlano recurso="crm" to={`/ocorrencias/nova?pedido=${p.id}`} variante="secundario">
                    Abrir contato
                  </BotaoPlano>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacao
        pagina={pagina}
        total={pedidos.length}
        porPagina={porPagina}
        singular="pedido"
        plural="pedidos"
        onPagina={onPagina}
      />
    </div>
  )
}

export default PedidosTable
