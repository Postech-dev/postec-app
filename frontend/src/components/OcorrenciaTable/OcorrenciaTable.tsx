import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Ocorrencia } from '../../types'
import { formatarAbertura, pluralOcorrencias, tempoRelativo } from '../../utils/format'
import CanalBadge from '../CanalBadge/CanalBadge'
import StatusBadge from '../StatusBadge/StatusBadge'
import './OcorrenciaTable.css'

interface OcorrenciaTableProps {
  itens: Ocorrencia[]
  pagina: number
  porPagina: number
  onPagina: (pagina: number) => void
}

function OcorrenciaTable({ itens, pagina, porPagina, onPagina }: OcorrenciaTableProps) {
  const navigate = useNavigate()
  // guarda busca e filtros para o botão voltar do detalhe
  const { search } = useLocation()
  const estado = { lista: search }
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina))
  const visiveis = itens.slice((pagina - 1) * porPagina, pagina * porPagina)

  return (
    <div className="otabela">
      <div className="otabela-rolagem">
        <table>
          <thead>
            <tr>
              <th scope="col">PROTOCOLO</th>
              <th scope="col">CLIENTE</th>
              <th scope="col">PEDIDO</th>
              <th scope="col">MOTIVO</th>
              <th scope="col">CANAL</th>
              <th scope="col">STATUS</th>
              <th scope="col">ABERTURA</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((o) => (
              <tr key={o.id} onClick={() => navigate(`/ocorrencias/${o.protocolo}`, { state: estado })}>
                <td>
                  <Link to={`/ocorrencias/${o.protocolo}`} state={estado} className="otabela-protocolo">
                    {o.protocolo}
                    {o.naoLida && (
                      <span className="ponto-nao-lida">
                        <span className="so-leitor"> (mensagem do cliente não lida)</span>
                      </span>
                    )}
                  </Link>
                </td>
                <td data-label="Cliente">{o.pedido.cliente.nome}</td>
                <td data-label="Pedido">{o.pedido.numero}</td>
                <td data-label="Motivo">{o.motivo}</td>
                <td data-label="Canal">
                  <CanalBadge canal={o.canal} />
                </td>
                <td data-label="Status">
                  <StatusBadge status={o.status} />
                </td>
                <td data-label="Abertura">
                  {formatarAbertura(o.abertaEm)}
                  {tempoRelativo(o.abertaEm) && <span className="otabela-tempo">{tempoRelativo(o.abertaEm)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="otabela-rodape">
        <span>
          {pluralOcorrencias(itens.length)} • Página {pagina} de {totalPaginas}
        </span>
        <div className="otabela-paginas">
          <button type="button" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
            Anterior
          </button>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>
            Próxima
          </button>
        </div>
      </footer>
    </div>
  )
}

export default OcorrenciaTable
