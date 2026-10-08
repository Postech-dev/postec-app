import type { Usuario } from '../../types'
import { HOJE, formatarDiaCompleto, iniciais } from '../../utils/format'
import './Topbar.css'

interface TopbarProps {
  usuario: Usuario
  menuAberto: boolean
  onMenu: () => void
}

function Topbar({ usuario, menuAberto, onMenu }: TopbarProps) {
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
        Workspace / <strong>{usuario.lojaNome}</strong>
      </span>
      <span className="topbar-data">
        {formatarDiaCompleto(HOJE)} • <span className="topbar-iniciais">{iniciais(usuario.nome)}</span>
      </span>
    </header>
  )
}

export default Topbar
