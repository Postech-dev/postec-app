import { useLocation } from 'react-router-dom'
import type { Usuario } from '../../types'
import { HOJE, formatarDiaCompleto, iniciais } from '../../utils/format'
import './Topbar.css'

interface TopbarProps {
  usuario: Usuario
  menuAberto: boolean
  onMenu: () => void
}

const ROTAS: Record<string, string> = {
  '/ocorrencias': 'Ocorrências',
  '/ocorrencias/kanban': 'Ocorrências / Kanban',
  '/pedidos': 'Pedidos',
  '/metricas': 'Métricas',
  '/lojas': 'Lojas',
  '/equipe': 'Equipe',
  '/integracoes': 'Integrações',
}

function breadcrumb(pathname: string): string {
  if (ROTAS[pathname]) return ROTAS[pathname]
  // /ocorrencias/:protocolo
  const match = pathname.match(/^\/ocorrencias\/(.+)$/)
  if (match) return `Ocorrências / ${match[1].toUpperCase()}`
  return ''
}

function Topbar({ usuario, menuAberto, onMenu }: TopbarProps) {
  const { pathname } = useLocation()
  const crumb = breadcrumb(pathname)

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-menu"
        onClick={onMenu}
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuAberto}
        aria-controls="menu-principal"
      >
        ☰
      </button>
      <span className="topbar-caminho">
        {crumb ? (
          <>
            {usuario.lojaNome} / <strong>{crumb}</strong>
          </>
        ) : (
          <strong>{usuario.lojaNome}</strong>
        )}
      </span>
      <span className="topbar-data">
        {formatarDiaCompleto(HOJE)} • <span className="topbar-iniciais">{iniciais(usuario.nome)}</span>
      </span>
    </header>
  )
}

export default Topbar
