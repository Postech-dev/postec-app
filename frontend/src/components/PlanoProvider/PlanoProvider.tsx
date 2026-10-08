import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { definirPlano, obterPlano } from '../../services/plano.service'
import type { Plano } from '../../types'
import { PlanoContext } from './planoContext'

function PlanoProvider({ children }: { children: ReactNode }) {
  const [plano, setPlano] = useState<Plano>(obterPlano)

  const trocarPlano = useCallback((novo: Plano) => {
    definirPlano(novo)
    setPlano(novo)
  }, [])

  const recarregar = useCallback(() => setPlano(obterPlano()), [])

  const valor = useMemo(() => ({ plano, trocarPlano, recarregar }), [plano, trocarPlano, recarregar])

  return <PlanoContext.Provider value={valor}>{children}</PlanoContext.Provider>
}

export default PlanoProvider
