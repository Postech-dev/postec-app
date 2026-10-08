import type { Usuario } from '../types'
import { equipeMock } from '../mocks/lojas'
import { atraso } from './atraso'

const equipe: Usuario[] = structuredClone(equipeMock)

export async function listarEquipe(): Promise<Usuario[]> {
  return atraso(structuredClone(equipe))
}

interface NovoAtendente {
  nome: string
  email: string
  senha: string
}

export async function criarAtendente({ nome, email }: NovoAtendente): Promise<Usuario> {
  const usuario: Usuario = {
    id: equipe.length + 1,
    nome,
    email,
    papel: 'Atendente',
    lojaNome: equipe[0].lojaNome,
  }
  equipe.push(usuario)
  return atraso(structuredClone(usuario))
}

// backend: criar o usuário sem senha, gerar um token de uso único com validade (ex.: 48 h)
// e enviar por e-mail o link /primeiro-acesso?token=...; substitui a senha inicial da administradora
export async function convidarAtendente(nome: string, email: string): Promise<{ conviteEnviadoPara: string }> {
  await criarAtendente({ nome, email, senha: '' })
  return atraso({ conviteEnviadoPara: email })
}

// backend: validar o token, gravar a senha escolhida (hash) e invalidar o token
export async function definirSenhaPrimeiroAcesso(token: string, senha: string): Promise<void> {
  return atraso(void [token, senha])
}
