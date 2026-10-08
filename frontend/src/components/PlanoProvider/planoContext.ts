import { createContext } from 'react'
import type { Plano } from '../../types'

export interface PlanoContexto {
  plano: Plano
  // só o modo demonstração usa
  trocarPlano: (plano: Plano) => void
}

export const PlanoContext = createContext<PlanoContexto>({ plano: 'starter', trocarPlano: () => {} })
