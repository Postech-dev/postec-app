import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Alert.css'

interface AlertProps {
  children: ReactNode
  // botão de ação à direita
  acao?: string
  to?: string
}

function Alert({ children, acao, to }: AlertProps) {
  return (
    <div className="alert" role="status">
      <span className="alert-texto">{children}</span>
      {acao && to && (
        <Link to={to} className="alert-botao">
          {acao}
        </Link>
      )}
    </div>
  )
}

export default Alert
