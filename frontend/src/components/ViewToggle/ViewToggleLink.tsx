import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// botão do segmented control — Link simples para não re-buscar dados ao trocar visão
function ViewToggleLink({ to, ativo, children }: { to: string; ativo: boolean; children: ReactNode }) {
  return (
    <Link to={to} replace className={ativo ? 'view-ativo' : ''} aria-current={ativo ? 'page' : undefined}>
      {children}
    </Link>
  )
}

export default ViewToggleLink
