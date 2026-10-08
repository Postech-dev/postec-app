import { useId } from 'react'
import type { ComponentProps } from 'react'
import '../Input/Input.css'

interface TextareaProps extends ComponentProps<'textarea'> {
  label: string
  obrigatorio?: boolean
  erro?: string
  // limite de caracteres; mostra o contador
  maximo?: number
}

function Textarea({ label, obrigatorio, erro, maximo, rows = 4, value, ...rest }: TextareaProps) {
  const id = useId()
  const idContador = `${id}-contador`
  const tamanho = String(value ?? '').length

  return (
    <div className="campo">
      <label htmlFor={id} className="campo-label">
        {label}
        {obrigatorio && <span className="campo-obrigatorio"> *</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maximo}
        className={`campo-input ${erro ? 'campo-invalido' : ''}`}
        aria-invalid={!!erro}
        aria-describedby={maximo ? idContador : undefined}
        style={{ resize: 'vertical' }}
        {...rest}
      />
      {maximo && (
        <span id={idContador} className="campo-dica campo-contador">
          {tamanho}/{maximo}
        </span>
      )}
      {erro && (
        <span className="campo-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  )
}

export default Textarea
