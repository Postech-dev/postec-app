import type { Usuario } from '../types'
import { planoDoBanco } from '../utils/adaptadores'
import { ErroApi, api } from './api'
import { gravarSessao, lerSessao, limparSessao } from './sessao'

interface RespostaAuth {
  token: string
  usuario: {
    id: number
    nome: string
    email: string
    role: 'admin' | 'atendente'
    loja_id: number
    loja_nome: string
    loja_slug: string
    loja_plano: string
  }
}

function guardar({ token, usuario }: RespostaAuth): Usuario {
  const adaptado: Usuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.role === 'admin' ? 'Administradora' : 'Atendente',
    lojaNome: usuario.loja_nome,
    lojaId: usuario.loja_id,
    lojaSlug: usuario.loja_slug,
    lojaPlano: planoDoBanco(usuario.loja_plano),
  }
  gravarSessao({ token, usuario: adaptado })
  return adaptado
}

export function usuarioLogado(): Usuario | null {
  return lerSessao()?.usuario ?? null
}

export async function login(email: string, senha: string): Promise<Usuario> {
  if (!email.trim() || !senha.trim()) throw new Error('Digite e-mail e senha para entrar.')
  try {
    const resposta = await api.post<RespostaAuth>('/auth/login', { email: email.trim(), senha }, { publico: true })
    return guardar(resposta)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) {
      throw new Error('E-mail ou senha incorretos. Confira os dados e tente de novo.', { cause: erro })
    }
    throw erro
  }
}

export function logout(): void {
  limparSessao()
}

interface NovoCadastro {
  nome: string
  loja: string
  email: string
  senha: string
}

// cria a loja (plano starter) e a administradora, e já abre a sessão
export async function cadastrar({ nome, loja, email, senha }: NovoCadastro): Promise<Usuario> {
  const resposta = await api.post<RespostaAuth>('/auth/cadastro', { nome, loja, email, senha }, { publico: true })
  return guardar(resposta)
}
