import type { Usuario } from '../types'

const CHAVE = 'postec:sessao'

interface Sessao {
  token: string
  usuario: Usuario
}

export function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as Sessao) : null
  } catch {
    return null
  }
}

export function gravarSessao(sessao: Sessao): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // sem armazenamento: o login só vale até recarregar a página
  }
}

export function limparSessao(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // nada a limpar
  }
}

export function tokenAtual(): string | null {
  return lerSessao()?.token ?? null
}
