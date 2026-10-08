import type { StatusOcorrencia } from '../types'

// ordem das etapas do fluxo
export const FLUXO: StatusOcorrencia[] = [
  'Novo',
  'Em triagem',
  'Aguardando devolução',
  'Reenvio solicitado',
  'Estorno solicitado',
  'Concluído',
]
