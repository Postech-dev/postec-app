import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import '../Input/Input.css'
import './Select.css'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  obrigatorio?: boolean
  erro?: string
  opcoes: string[]
  placeholder?: string
}

function Select({ label, obrigatorio, erro, opcoes, placeholder, ...rest }: SelectProps) {
  const id = useId()

  const campo = (
    <select id={id} className={`campo-input ${erro ? 'campo-invalido' : ''}`} aria-invalid={!!erro} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {opcoes.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )

  // sem label: renderiza só o select (útil em toolbars inline)
  if (!label) return campo

  return (
    <div className="campo">
      <label htmlFor={id} className="campo-label">
        {label}
        {obrigatorio && <span className="campo-obrigatorio"> *</span>}
      </label>
      {campo}
      {erro && (
        <span className="campo-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  )
}

export default Select
