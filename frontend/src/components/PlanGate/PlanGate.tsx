import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePlano } from '../../hooks/usePlano'
import type { Recurso } from '../../types'
import { NOMES } from '../../utils/planos'
import Button from '../Button/Button'
import PlanosModal from '../PlanosModal/PlanosModal'
import './PlanGate.css'

interface PlanGateProps {
  recurso: Recurso
  children: ReactNode
}

// recurso fora do plano: o conteúdo aparece esmaecido, sem clique, com cadeado e convite
// (visual apenas; quem bloqueia de verdade é o backend, veja usePlano)
function PlanGate({ recurso, children }: PlanGateProps) {
  const { inclui, planoMinimo } = usePlano()
  const [planos, setPlanos] = useState(false)

  if (inclui(recurso)) return <>{children}</>

  return (
    <div className="gate">
      <div className="gate-aviso" role="status">
        <span aria-hidden="true">🔒</span>
        <strong>Disponível no plano {NOMES[planoMinimo(recurso)]}</strong>
        <Button onClick={() => setPlanos(true)}>Conhecer planos</Button>
      </div>
      {/* inert tira o conteúdo do teclado e dos leitores de tela */}
      <div className="gate-conteudo" inert aria-hidden="true">
        {children}
      </div>
      <PlanosModal aberto={planos} onFechar={() => setPlanos(false)} />
    </div>
  )
}

export default PlanGate
