import type { Plano } from '../types'
import { lojasMock } from '../mocks/lojas'
import { ORDEM } from '../utils/planos'

const CHAVE = 'postec:plano'

// backend: o plano vem da loja logada (campo plano em GET /lojas/:id ou no login); não é escolhido pelo front
// aqui ele é mockado e pode ser trocado na demonstração
export function obterPlano(): Plano {
  try {
    const salvo = sessionStorage.getItem(CHAVE) as Plano | null
    if (salvo && ORDEM.includes(salvo)) return salvo
  } catch {
    // sem acesso ao armazenamento: usa o plano do mock
  }
  return lojasMock[0].plano
}

// só o modo demonstração chama isto
export function definirPlano(plano: Plano): void {
  try {
    sessionStorage.setItem(CHAVE, plano)
  } catch {
    // a troca vale só enquanto a página estiver aberta
  }
}
