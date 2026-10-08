import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  obrigatorio?: boolean
  erro?: string
  dica?: string
}

function Input({ label, obrigatorio, erro, dica, ...rest }: InputProps) {
  const id = useId()

  return (
    <div className="campo">
      <label htmlFor={id} className="campo-label">
        {label}
        {obrigatorio && <span className="campo-obrigatorio"> *</span>}
      </label>
      <input id={id} className={`campo-input ${erro ? 'campo-invalido' : ''}`} aria-invalid={!!erro} {...rest} />
      {dica && !erro && <span className="campo-dica">{dica}</span>}
      {erro && (
        <span className="campo-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  )
}

export default Input
