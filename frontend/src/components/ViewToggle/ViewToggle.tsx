import { useLocation } from 'react-router-dom'
import ViewToggleLink from './ViewToggleLink'
import './ViewToggle.css'

// preserva busca e filtros ao trocar de visão (q, status, canal)
function filtrosParam(search: string): string {
  const p = new URLSearchParams(search)
  p.delete('pagina')
  const s = p.toString()
  return s ? `?${s}` : ''
}

function ViewToggle() {
  const { search, pathname } = useLocation()
  const params = filtrosParam(search)
  const tabelaAtiva = pathname === '/ocorrencias'

  return (
    <div className="view-toggle" role="group" aria-label="Alternar visão">
      <ViewToggleLink to={`/ocorrencias${params}`} ativo={tabelaAtiva}>
        Tabela
      </ViewToggleLink>
      <ViewToggleLink to={`/ocorrencias/kanban${params}`} ativo={!tabelaAtiva}>
        Kanban
      </ViewToggleLink>
    </div>
  )
}

export default ViewToggle
