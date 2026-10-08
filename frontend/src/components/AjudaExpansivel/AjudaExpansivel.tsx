import type { ReactNode } from 'react'
import './AjudaExpansivel.css'

interface AjudaExpansivelProps {
  pergunta: string
  children: ReactNode
}

// ajuda que abre e fecha; o <details> já funciona com teclado e leitor de tela
function AjudaExpansivel({ pergunta, children }: AjudaExpansivelProps) {
  return (
    <details className="ajuda">
      <summary>{pergunta}</summary>
      <div className="ajuda-texto">{children}</div>
    </details>
  )
}

export default AjudaExpansivel
