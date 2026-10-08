import { Link } from 'react-router-dom'
import type { Ocorrencia } from '../../types'
import { formatarAbertura, pluralOcorrencias, tempoRelativo } from '../../utils/format'
import { FLUXO } from '../../utils/status'
import './KanbanBoard.css'

function KanbanBoard({ itens }: { itens: Ocorrencia[] }) {
  return (
    <div className="kanban">
      {FLUXO.map((status) => {
        const cartoes = itens.filter((o) => o.status === status)
        return (
          <section key={status} className="kanban-coluna">
            <header className="kanban-cabecalho">
              <strong>{status}</strong>
              <span>{pluralOcorrencias(cartoes.length)}</span>
            </header>
            {cartoes.length === 0 && <p className="kanban-vazio">Nenhum caso nesta etapa.</p>}
            {cartoes.map((o) => (
              <article key={o.id} className="kanban-cartao">
                <strong className="kanban-protocolo">
                  {o.protocolo}
                  {o.naoLida && (
                    <span className="ponto-nao-lida">
                      <span className="so-leitor"> (mensagem do cliente não lida)</span>
                    </span>
                  )}
                </strong>
                <span className="kanban-cliente">{o.pedido.cliente.nome}</span>
                <span>{o.motivo}</span>
                <span className="kanban-meta">
                  {o.pedido.numero} • {formatarAbertura(o.abertaEm)}
                  {tempoRelativo(o.abertaEm) && ` • ${tempoRelativo(o.abertaEm)}`}
                </span>
                <Link to={`/ocorrencias/${o.protocolo}`} className="kanban-ver">
                  Ver caso<span className="so-leitor"> {o.protocolo}</span>
                </Link>
              </article>
            ))}
          </section>
        )
      })}
    </div>
  )
}

export default KanbanBoard
