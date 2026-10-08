import { useId } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma' | 'perigo'
  bloco?: boolean
  carregando?: boolean
  // texto enquanto processa
  textoCarregando?: string
  // desabilita o botão e explica o porquê ao lado
  motivoDesabilitado?: string
  // quando informado, renderiza como link
  to?: string
  // link para fora do app: abre em nova aba
  externo?: boolean
  // estado repassado ao link (só vale com `to`)
  state?: unknown
  children: ReactNode
}

function Button({
  variante = 'primario',
  bloco,
  carregando,
  textoCarregando = 'Enviando…',
  motivoDesabilitado,
  to,
  externo,
  state,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const idMotivo = useId()
  const classes = ['btn', `btn-${variante}`, bloco ? 'btn-bloco' : '', className ?? ''].join(' ').trim()

  if (to && externo) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={classes}>
        {children}
        <span className="so-leitor"> (abre em nova aba)</span>
      </a>
    )
  }

  if (to) {
    return (
      <Link to={to} state={state} className={classes}>
        {children}
      </Link>
    )
  }

  const botao = (
    <button
      className={classes}
      disabled={disabled || carregando || !!motivoDesabilitado}
      aria-busy={carregando}
      aria-describedby={motivoDesabilitado ? idMotivo : undefined}
      {...rest}
    >
      {carregando ? textoCarregando : children}
    </button>
  )

  if (!motivoDesabilitado) return botao

  return (
    <div className="btn-com-motivo">
      {botao}
      <span id={idMotivo} className="btn-motivo">
        {motivoDesabilitado}
      </span>
    </div>
  )
}

export default Button
