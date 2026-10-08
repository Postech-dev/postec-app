import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePlano } from '../../hooks/usePlano'
import type { Recurso } from '../../types'
import { NOMES } from '../../utils/planos'
import Button from '../Button/Button'
import PlanosModal from '../PlanosModal/PlanosModal'

interface BotaoPlanoProps {
  recurso: Recurso
  // destino quando o plano inclui o recurso
  to: string
  variante?: 'primario' | 'secundario' | 'fantasma'
  children: ReactNode
}

// botão de recurso pago: no plano certo navega; nos outros fica visível, com cadeado, e abre os planos
function BotaoPlano({ recurso, to, variante = 'primario', children }: BotaoPlanoProps) {
  const { inclui, planoMinimo } = usePlano()
  const [planos, setPlanos] = useState(false)

  if (inclui(recurso)) {
    return (
      <Button to={to} variante={variante}>
        {children}
      </Button>
    )
  }

  return (
    <>
      <Button variante={variante} onClick={() => setPlanos(true)}>
        <span aria-hidden="true">🔒 </span>
        {children}
        <span className="so-leitor"> (disponível no plano {NOMES[planoMinimo(recurso)]})</span>
      </Button>
      <PlanosModal aberto={planos} onFechar={() => setPlanos(false)} />
    </>
  )
}

export default BotaoPlano
