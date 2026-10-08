import type { Usuario } from '../types'
import { equipeMock } from '../mocks/lojas'
import { atraso } from './atraso'
import { criarLoja } from './lojas.service'

const CHAVE = 'postec:usuario'

export function usuarioLogado(): Usuario | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as Usuario) : null
  } catch {
    return null
  }
}

// mock: aceita qualquer credencial preenchida
export async function login(email: string, senha: string): Promise<Usuario> {
  if (!email.trim() || !senha.trim()) throw new Error('Digite e-mail e senha para entrar.')
  const usuario = equipeMock.find((u) => u.email === email.trim().toLowerCase()) ?? equipeMock[0]
  sessionStorage.setItem(CHAVE, JSON.stringify(usuario))
  return atraso(usuario)
}

export function logout(): void {
  sessionStorage.removeItem(CHAVE)
}

interface NovoCadastro {
  nome: string
  loja: string
  email: string
  senha: string
}

// mock: cria a loja e a administradora e já abre a sessão
export async function cadastrar({ nome, loja, email }: NovoCadastro): Promise<Usuario> {
  if (equipeMock.some((u) => u.email === email.toLowerCase())) throw new Error('Este e-mail já tem cadastro. Entre com ele ou use outro e-mail.')
  await criarLoja(loja)
  const usuario: Usuario = {
    id: equipeMock.length + 1,
    nome,
    email: email.toLowerCase(),
    papel: 'Administradora',
    lojaNome: loja,
  }
  sessionStorage.setItem(CHAVE, JSON.stringify(usuario))
  return atraso(usuario)
}
