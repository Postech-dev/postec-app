import type { ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  eyebrow?: string
  titulo: string
  subtitulo?: string
  acoes?: ReactNode
}

function PageHeader({ eyebrow, titulo, subtitulo, acoes }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {/* eyebrow removido — breadcrumb na topbar cobre essa função */}
        <h1 className="page-header-titulo">{titulo}</h1>
        {subtitulo && <p className="page-header-subtitulo">{subtitulo}</p>}
      </div>
      {acoes && <div className="page-header-acoes">{acoes}</div>}
    </header>
  )
}

export default PageHeader
