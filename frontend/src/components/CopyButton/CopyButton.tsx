import { useEffect, useRef, useState } from 'react'
import './CopyButton.css'

interface CopyButtonProps {
  texto: string
  rotulo: string
}

function CopyButton({ texto, rotulo }: CopyButtonProps) {
  const [copiado, setCopiado] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      // sem permissão da área de transferência: seleciona via campo temporário
      const campo = document.createElement('textarea')
      campo.value = texto
      document.body.appendChild(campo)
      campo.select()
      document.execCommand('copy')
      campo.remove()
    }
    setCopiado(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button type="button" className="copiar" onClick={copiar} aria-label={`${rotulo}: ${texto}`}>
      <span aria-hidden="true">{copiado ? '✓' : '⧉'}</span>
      <span aria-live="polite">{copiado ? 'Copiado!' : rotulo}</span>
    </button>
  )
}

export default CopyButton
