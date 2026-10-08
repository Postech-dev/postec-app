import type { HTMLAttributes, ReactNode } from 'react'
import './Card.css'

interface CardProps extends HTMLAttributes<HTMLElement> {
  titulo?: string
  children: ReactNode
}

function Card({ titulo, children, className = '', ...rest }: CardProps) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {titulo && <h2 className="card-titulo">{titulo}</h2>}
      {children}
    </section>
  )
}

export default Card
