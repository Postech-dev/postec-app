import type { Loja } from '../types'
import { adaptarLoja } from '../utils/adaptadores'
import type { LinhaLojaApi } from '../utils/adaptadores'
import { ErroApi, api } from './api'
import { usuarioLogado } from './auth.service'
import { obterPlano } from './plano.service'

const ERRO_LOJA = 'Não encontramos essa loja. Confira o endereço do portal com a loja ou volte à lista de lojas.'

// na loja logada, o seletor da demonstração pode trocar o plano na tela
function comPlano(loja: Loja): Loja {
  return loja.id === usuarioLogado()?.lojaId ? { ...loja, plano: obterPlano() } : loja
}

async function traduzir404<T>(chamada: Promise<T>): Promise<T> {
  try {
    return await chamada
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) throw new Error(ERRO_LOJA, { cause: erro })
    throw erro
  }
}

export async function listarLojas(): Promise<Loja[]> {
  const linhas = await api.get<LinhaLojaApi[]>('/lojas')
  return linhas.map(adaptarLoja).map(comPlano)
}

export async function buscarLoja(id: number): Promise<Loja> {
  return comPlano(adaptarLoja(await traduzir404(api.get<LinhaLojaApi>(`/lojas/${id}`))))
}

// público: o portal do cliente usa para mostrar o nome da loja, o prazo e o endereço de devolução
export async function buscarLojaPorSlug(slug: string): Promise<Loja> {
  const linha = await traduzir404(api.get<LinhaLojaApi>(`/portal/${encodeURIComponent(slug)}`, { publico: true }))
  return comPlano(adaptarLoja(linha))
}

type DadosLoja = Pick<Loja, 'nome' | 'slug' | 'email' | 'prazoRespostaDias' | 'enderecoDevolucao'>

export async function salvarLoja(id: number, dados: DadosLoja): Promise<Loja> {
  const resposta = await api.put<{ loja: LinhaLojaApi }>(`/lojas/${id}`, {
    nome: dados.nome,
    slug: dados.slug,
    email: dados.email,
    prazo_resposta_dias: dados.prazoRespostaDias,
    endereco_devolucao: dados.enderecoDevolucao,
  })
  return comPlano(adaptarLoja(resposta.loja))
}

// a exclusão ainda não apaga nada: a tela só confirma
export async function excluirLoja(): Promise<void> {
  return
}
