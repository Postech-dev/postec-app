import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import './Modal.css'

interface ModalProps {
  aberto: boolean
  onFechar: () => void
  eyebrow?: string
  titulo: string
  children?: ReactNode
  acoes?: ReactNode
  // modal mais largo, para conteúdo em colunas
  larga?: boolean
}

const FOCAVEIS = 'a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])'

function Modal({ aberto, onFechar, eyebrow, titulo, children, acoes, larga }: ModalProps) {
  const idTitulo = useId()
  const caixa = useRef<HTMLDivElement>(null)
  // guarda o callback mais recente sem refazer o efeito (e sem roubar o foco dos campos)
  const fecharRef = useRef(onFechar)
  useEffect(() => {
    fecharRef.current = onFechar
  })

  // esc fecha; o foco entra no modal e volta para quem abriu
  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && fecharRef.current()
    document.addEventListener('keydown', fechar)
    caixa.current?.focus()
    return () => {
      document.removeEventListener('keydown', fechar)
      anterior?.focus()
    }
  }, [aberto])

  // mantém o Tab dentro do modal
  function prenderFoco(e: ReactKeyboardEvent) {
    if (e.key !== 'Tab' || !caixa.current) return
    const itens = Array.from(caixa.current.querySelectorAll<HTMLElement>(FOCAVEIS))
    if (itens.length === 0) return
    const primeiro = itens[0]
    const ultimo = itens[itens.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primeiro.focus()
    }
  }

  if (!aberto) return null

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div
        ref={caixa}
        className={`modal ${larga ? 'modal-larga' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={prenderFoco}
      >
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 id={idTitulo} className="modal-titulo">
          {titulo}
        </h2>
        {children}
        {acoes && <div className="modal-acoes">{acoes}</div>}
      </div>
    </div>
  )
}

export default Modal
