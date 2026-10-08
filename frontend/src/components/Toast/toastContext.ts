import { createContext } from 'react'

export interface ToastContexto {
  mostrar: (texto: string) => void
}

export const ToastContext = createContext<ToastContexto>({ mostrar: () => {} })
