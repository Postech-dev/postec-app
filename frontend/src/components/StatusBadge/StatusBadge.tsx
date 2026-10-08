import type { StatusOcorrencia } from '../../types'
import { STATUS_CLIENTE } from '../../utils/statusCliente'
import './StatusBadge.css'

const classes: Record<StatusOcorrencia, string> = {
  Novo: 'novo',
  'Em triagem': 'triagem',
  'Aguardando devolução': 'devolucao',
  'Reenvio solicitado': 'reenvio',
  'Estorno solicitado': 'estorno',
  Concluído: 'concluido',
}

interface StatusBadgeProps {
  status: StatusOcorrencia
  // no portal, mostra o texto pensado para o cliente
  cliente?: boolean
}

function StatusBadge({ status, cliente }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${classes[status]} ${cliente ? 'status-badge-cliente' : ''}`}>
      {cliente ? STATUS_CLIENTE[status].rotulo : status}
    </span>
  )
}

export default StatusBadge
