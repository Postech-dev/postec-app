import type { Ocorrencia } from '../../types'
import { formatarMoeda, tamanhoCurto } from '../../utils/format'
import Card from '../Card/Card'
import './ResumoCaso.css'

function ResumoCaso({ ocorrencia: o }: { ocorrencia: Ocorrencia }) {
  const linhas: [string, string][] = [
    ['Protocolo', o.protocolo],
    ['Cliente', o.pedido.cliente.nome],
    ['Pedido', o.pedido.numero],
    ['Motivo', o.motivo],
    ['Produto', `${o.pedido.produto} • ${tamanhoCurto(o.pedido.detalhe)}`],
    ['Valor original', formatarMoeda(o.pedido.valor)],
  ]

  return (
    <Card titulo="Resumo do caso">
      <dl className="resumo">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt>{rotulo}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export default ResumoCaso
