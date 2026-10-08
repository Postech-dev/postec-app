import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './toastContext'
import './Toast.css'

// aviso curto que some sozinho; leitores de tela anunciam via aria-live
function Toast({ children }: { children: ReactNode }) {
  const [texto, setTexto] = useState('')
  const timer = useRef<number | undefined>(undefined)

  const mostrar = useCallback((novo: string) => {
    window.clearTimeout(timer.current)
    setTexto(novo)
    timer.current = window.setTimeout(() => setTexto(''), 4000)
  }, [])

  const valor = useMemo(() => ({ mostrar }), [mostrar])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-area" role="status" aria-live="polite">
        {texto && <div className="toast">{texto}</div>}
      </div>
    </ToastContext.Provider>
  )
}

export default Toast
