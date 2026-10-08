import type { Ocorrencia } from '../types'

// 0 novos, 1 aguardando resposta da loja, 2 em andamento, 3 concluídos
function grupo(o: Ocorrencia): number {
  if (o.status === 'Concluído') return 3
  if (o.status === 'Novo') return 0
  return o.aguardandoLoja ? 1 : 2
}

// prioridade de atendimento: novos primeiro, depois quem espera resposta há mais tempo
export function ordenarPorPrioridade(itens: Ocorrencia[]): Ocorrencia[] {
  return [...itens].sort((a, b) => {
    const diff = grupo(a) - grupo(b)
    if (diff !== 0) return diff
    // novos e quem espera resposta: o mais antigo primeiro; os demais: o mais recente primeiro
    const maisAntigoPrimeiro = grupo(a) <= 1
    const cmp = a.abertaEm.localeCompare(b.abertaEm)
    return maisAntigoPrimeiro ? cmp : -cmp
  })
}
