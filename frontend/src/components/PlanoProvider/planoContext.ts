import { createContext } from 'react'
import type { Plano } from '../../types'

export interface PlanoContexto {
  plano: Plano
  // só o modo demonstração usa
  trocarPlano: (plano: Plano) => void
  // lê de novo o plano da loja logada (depois do login)
  recarregar: () => void
}

export const PlanoContext = createContext<PlanoContexto>({ plano: 'starter', trocarPlano: () => {}, recarregar: () => {} })
