import type { Metricas } from '../types'
import { atraso } from './atraso'
import { calcularMetricas } from './simulado/ocorrencias.simulado'

// backend: GET /metricas (só plano Business; 403 nos outros, via requirePlan)
// - abertas: ocorrências com status diferente de Concluído
// - tempoMedioPrimeiraResposta: média, em minutos, entre a abertura e a 1ª mensagem da loja ao cliente (notas internas não contam)
// - taxaResolucao: concluídas / total, no período pedido
// - porMotivo e porCanal: contagem de ocorrências agrupada
export async function obterMetricas(): Promise<Metricas> {
  return atraso(calcularMetricas())
}
