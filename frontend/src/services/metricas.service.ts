import type { Metricas } from '../types'
import { CANAIS } from '../utils/canais'
import { diasDesde, HOJE } from '../utils/format'
import { listarOcorrencias } from './ocorrencias.service'

// "aberta" = tudo que não é Concluído — mesma definição usada na lista e no resumo
function estaAberta(status: string) {
  return status !== 'Concluído'
}

function minutos(iso: string): number {
  const [data, hora] = iso.split('T')
  const [ano, mes, dia] = data.split('-').map(Number)
  const [hh, mm] = (hora ?? '00:00').split(':').map(Number)
  return Date.UTC(ano, mes - 1, dia, hh, mm) / 60_000
}

function contarPorChave(itens: string[]): { rotulo: string; valor: number }[] {
  const mapa = new Map<string, number>()
  itens.forEach((k) => mapa.set(k, (mapa.get(k) ?? 0) + 1))
  return [...mapa].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor)
}

// calcula métricas a partir da lista real — mesma fonte que /ocorrencias e o kanban
export async function obterMetricas(dias = 30): Promise<Metricas> {
  const todas = await listarOcorrencias()

  // filtro de período: abertura dentro dos últimos N dias
  const noPeriodo = todas.filter((o) => diasDesde(o.abertaEm) <= dias)

  // tempo até 1ª resposta: só casos abertos pelo cliente (canal portal) com ao menos uma mensagem da loja
  // — sem acesso às mensagens aqui, usamos o campo ultimaAtividade como proxy quando disponível
  // quando o backend expuser o campo primeira_resposta_em, substituir aqui
  const abertas = todas.filter((o) => estaAberta(o.status)).length

  const concluídasPeriodo = noPeriodo.filter((o) => o.status === 'Concluído')
  const taxaResolucao = noPeriodo.length
    ? Math.round((concluídasPeriodo.length / noPeriodo.length) * 100)
    : 0

  const reenvios = noPeriodo.filter((o) => o.resolucao?.tipo === 'Reenvio').length
  const estornos = noPeriodo.filter((o) => o.resolucao?.tipo === 'Estorno')
  const valorEstornos = estornos.reduce((soma, o) => soma + (o.resolucao?.valor ?? 0), 0)

  // por motivo e canal: sobre todas as ocorrências do período
  const porMotivo = contarPorChave(noPeriodo.map((o) => o.motivo))
  const porCanal = contarPorChave(noPeriodo.map((o) => CANAIS[o.canal] ?? o.canal))

  // por status: sobre todas (não filtrado por período — reflete o estado atual)
  const porStatus = contarPorChave(todas.map((o) => o.status))

  // abertas x concluídas por semana (últimas 8 semanas)
  const porSemana = calcularPorSemana(todas)

  return {
    abertas,
    tempoMedioPrimeiraResposta: null, // requer campo do backend; sempre null até implementar
    taxaResolucao,
    porMotivo,
    porCanal,
    reenviosPeriodo: reenvios,
    estornosPeriodo: estornos.length,
    valorEstornosPeriodo: valorEstornos,
    porStatus,
    porSemana,
  }
}

function calcularPorSemana(todas: Awaited<ReturnType<typeof listarOcorrencias>>) {
  const semanas: { rotulo: string; abertas: number; concluidas: number }[] = []
  for (let s = 7; s >= 0; s--) {
    const inicioMs = Date.now() - (s + 1) * 7 * 86_400_000
    const fimMs = Date.now() - s * 7 * 86_400_000
    const naSemana = todas.filter((o) => {
      const t = minutos(o.abertaEm) * 60_000
      return t >= inicioMs && t < fimMs
    })
    const semanaLabel = new Date(fimMs).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    semanas.push({
      rotulo: semanaLabel,
      abertas: naSemana.filter((o) => estaAberta(o.status)).length,
      concluidas: naSemana.filter((o) => o.status === 'Concluído').length,
    })
  }
  return semanas
}
