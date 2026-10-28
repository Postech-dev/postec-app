import type { Usuario } from '../types'
import { api } from './api'

interface UsuarioApi {
  id: number
  nome: string
  email: string
  role: 'admin' | 'atendente'
  loja_id: number
  loja_nome: string
}

function adaptar(usuario: UsuarioApi): Usuario {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.role === 'admin' ? 'Administradora' : 'Atendente',
    lojaId: usuario.loja_id,
    lojaNome: usuario.loja_nome,
  }
}

export async function listarEquipe(): Promise<Usuario[]> {
  return (await api.get<UsuarioApi[]>('/equipe')).map(adaptar)
}

interface NovoAtendente {
  nome: string
  email: string
  senha: string
}

export async function criarAtendente(dados: NovoAtendente): Promise<Usuario> {
  return adaptar(await api.post<UsuarioApi>('/equipe', dados))
}
