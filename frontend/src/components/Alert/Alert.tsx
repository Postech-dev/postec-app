import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Alert.css'

interface AlertProps {
  children: ReactNode
  // com `to`, o aviso inteiro vira um link
  to?: string
}

function Alert({ children, to }: AlertProps) {
  if (to) {
    return (
      <Link to={to} className="alert alert-link">
        {children}
        <span aria-hidden="true"> →</span>
      </Link>
    )
  }

  return (
    <div className="alert" role="status">
      {children}
    </div>
  )
}

export default Alert
