import { Link } from 'react-router-dom'
import type { Ocorrencia } from '../../types'
import { formatarAbertura, pluralOcorrencias, tempoRelativo } from '../../utils/format'
import { FLUXO } from '../../utils/status'
import './KanbanBoard.css'

const COLUNAS = FLUXO.filter((s) => s !== 'Concluído')

function KanbanBoard({ itens }: { itens: Ocorrencia[] }) {
  return (
    <div className="kanban-wrapper">
      <div className="kanban">
        {COLUNAS.map((status) => {
          const cartoes = itens.filter((o) => o.status === status)
          return (
            <section key={status} className="kanban-coluna">
              <header className="kanban-cabecalho">
                <strong>{status}</strong>
                <span>{pluralOcorrencias(cartoes.length)}</span>
              </header>
              <div className="kanban-cartoes">
                {cartoes.length === 0 && <p className="kanban-vazio">Nenhum caso nesta etapa.</p>}
                {cartoes.map((o) => (
                  <Link key={o.id} to={`/ocorrencias/${o.protocolo}`} className="kanban-cartao">
                    <strong className="kanban-protocolo">
                      {o.protocolo}
                      {o.naoLida && (
                        <span className="ponto-nao-lida">
                          <span className="so-leitor"> (mensagem do cliente não lida)</span>
                        </span>
                      )}
                    </strong>
                    <span className="kanban-cliente">{o.pedido.cliente.nome}</span>
                    <span className="kanban-motivo">{o.motivo}</span>
                    <span className="kanban-meta">
                      <span>{o.pedido.numero} · {formatarAbertura(o.abertaEm)}</span>
                      {tempoRelativo(o.abertaEm) && (
                        <span className="kanban-meta-tempo">{tempoRelativo(o.abertaEm)}</span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default KanbanBoard
