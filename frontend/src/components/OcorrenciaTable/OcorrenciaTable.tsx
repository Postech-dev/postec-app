import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Ocorrencia } from '../../types'
import { diasDesde, formatarAbertura, pluralOcorrencias, tempoRelativo } from '../../utils/format'
import CanalBadge from '../CanalBadge/CanalBadge'
import StatusBadge from '../StatusBadge/StatusBadge'
import './OcorrenciaTable.css'

// casos sem resposta acima deste número de dias ficam destacados
const DIAS_ALERTA = 3

type Coluna = 'protocolo' | 'cliente' | 'pedido' | 'motivo' | 'canal' | 'status' | 'abertura' | 'responsavel'
type Direcao = 'asc' | 'desc'

interface OcorrenciaTableProps {
  itens: Ocorrencia[]
  pagina: number
  porPagina: number
  onPagina: (pagina: number) => void
}

function ordenar(itens: Ocorrencia[], coluna: Coluna, direcao: Direcao): Ocorrencia[] {
  return [...itens].sort((a, b) => {
    let va: string | number = ''
    let vb: string | number = ''
    if (coluna === 'protocolo')   { va = a.protocolo;           vb = b.protocolo }
    if (coluna === 'cliente')     { va = a.pedido.cliente.nome; vb = b.pedido.cliente.nome }
    if (coluna === 'pedido')      { va = a.pedido.numero;       vb = b.pedido.numero }
    if (coluna === 'motivo')      { va = a.motivo;              vb = b.motivo }
    if (coluna === 'canal')       { va = a.canal;               vb = b.canal }
    if (coluna === 'status')      { va = a.status;              vb = b.status }
    if (coluna === 'abertura')    { va = a.abertaEm;            vb = b.abertaEm }
    if (coluna === 'responsavel') { va = a.responsavel ?? '';   vb = b.responsavel ?? '' }
    if (va < vb) return direcao === 'asc' ? -1 : 1
    if (va > vb) return direcao === 'asc' ? 1 : -1
    return 0
  })
}

function OcorrenciaTable({ itens, pagina, porPagina, onPagina }: OcorrenciaTableProps) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const estado = { lista: search }

  // padrão: mais antigas abertas primeiro
  const [coluna, setColuna] = useState<Coluna>('abertura')
  const [direcao, setDirecao] = useState<Direcao>('asc')

  function alternarOrdem(c: Coluna) {
    if (coluna === c) {
      setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setColuna(c)
      setDirecao('asc')
    }
  }

  const ordenados = ordenar(itens, coluna, direcao)
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina))
  const visiveis = ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)

  function icone(c: Coluna) {
    if (coluna !== c) return <span className="otabela-sort" aria-hidden="true">↕</span>
    return <span className="otabela-sort otabela-sort-ativo" aria-hidden="true">{direcao === 'asc' ? '↑' : '↓'}</span>
  }

  function Th({ col, label }: { col: Coluna; label: string }) {
    return (
      <th scope="col" onClick={() => alternarOrdem(col)} className="otabela-th-sort">
        {label}{icone(col)}
      </th>
    )
  }

  return (
    <div className="otabela">
      <div className="otabela-rolagem">
        <table>
          <thead>
            <tr>
              <Th col="protocolo"   label="PROTOCOLO" />
              <Th col="cliente"     label="CLIENTE" />
              <Th col="pedido"      label="PEDIDO" />
              <Th col="motivo"      label="MOTIVO" />
              <Th col="canal"       label="CANAL" />
              <Th col="status"      label="STATUS" />
              <Th col="responsavel" label="RESPONSÁVEL" />
              <Th col="abertura"    label="ABERTURA" />
            </tr>
          </thead>
          <tbody>
            {visiveis.map((o) => {
              const dias = diasDesde(o.abertaEm)
              const atrasado = o.status !== 'Concluído' && dias >= DIAS_ALERTA
              return (
                <tr
                  key={o.id}
                  className={atrasado ? 'otabela-atrasado' : ''}
                  onClick={() => navigate(`/ocorrencias/${o.protocolo}`, { state: estado })}
                >
                  <td>
                    <Link to={`/ocorrencias/${o.protocolo}`} state={estado} className="otabela-protocolo">
                      {o.protocolo}
                      {o.naoLida && (
                        <span className="ponto-nao-lida" title="Cliente respondeu — aguardando resposta da loja">
                          <span className="so-leitor"> (mensagem do cliente não lida)</span>
                        </span>
                      )}
                    </Link>
                  </td>
                  <td data-label="Cliente">{o.pedido.cliente.nome}</td>
                  <td data-label="Pedido">{o.pedido.numero}</td>
                  <td data-label="Motivo">{o.motivo}</td>
                  <td data-label="Canal"><CanalBadge canal={o.canal} /></td>
                  <td data-label="Status"><StatusBadge status={o.status} /></td>
                  <td data-label="Responsável" className="otabela-responsavel">
                    {o.responsavel ?? <span className="otabela-vazio-cel">—</span>}
                  </td>
                  <td data-label="Abertura" className={atrasado ? 'otabela-data-alerta' : ''}>
                    {formatarAbertura(o.abertaEm)}
                    {tempoRelativo(o.abertaEm) && (
                      <span className="otabela-tempo">{tempoRelativo(o.abertaEm)}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <footer className="otabela-rodape">
          <span>{pluralOcorrencias(itens.length)} · página {pagina} de {totalPaginas}</span>
          <div className="otabela-paginas">
            <button type="button" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
              Anterior
            </button>
            <button type="button" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>
              Próxima
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default OcorrenciaTable
