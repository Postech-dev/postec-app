import type { ReactNode } from 'react'
import '../Input/Input.css'
import './AuthLayout.css'

interface AuthLayoutProps {
  titulo: string
  subtitulo: string
  children: ReactNode
}

// tela dividida: card sobre o laranja à esquerda, marca à direita
function AuthLayout({ titulo, subtitulo, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <section className="auth-painel">
        <div className="auth-card">
          <div className="auth-cabecalho">
            <h1 className="auth-titulo">{titulo}</h1>
            <p className="auth-sub">{subtitulo}</p>
          </div>
          {children}
        </div>
      </section>

      <section className="auth-marca">
        <img className="auth-icone" src="/logo.png" alt="" />
        <p className="auth-nome">
          Pos<span>Tec</span>
        </p>
        <p className="auth-slogan">Tecnologia e praticidade para Pós Vendas.</p>
      </section>
    </div>
  )
}

export default AuthLayout
