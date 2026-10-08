import type { ReactNode } from 'react'
import './EstadoVazio.css'

interface EstadoVazioProps {
  titulo: string
  texto: string
  // ação sugerida (botão ou link)
  children?: ReactNode
}

function EstadoVazio({ titulo, texto, children }: EstadoVazioProps) {
  return (
    <div className="vazio">
      <strong className="vazio-titulo">{titulo}</strong>
      <p>{texto}</p>
      {children}
    </div>
  )
}

export default EstadoVazio
