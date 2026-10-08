import type { Plano } from '../types'
import { ORDEM } from '../utils/planos'
import { usuarioLogado } from './auth.service'

const CHAVE = 'postec:plano'

// o plano vem da loja logada (login); o seletor da demonstração só sobrescreve na tela
// backend: quem bloqueia recurso por plano é o servidor (requirePlan); isto é só visual
export function obterPlano(): Plano {
  try {
    const salvo = sessionStorage.getItem(CHAVE) as Plano | null
    if (salvo && ORDEM.includes(salvo)) return salvo
  } catch {
    // sem acesso ao armazenamento: usa o plano da loja
  }
  return usuarioLogado()?.lojaPlano ?? 'starter'
}

// só o modo demonstração chama isto
export function definirPlano(plano: Plano): void {
  try {
    sessionStorage.setItem(CHAVE, plano)
  } catch {
    // a troca vale só enquanto a página estiver aberta
  }
}
