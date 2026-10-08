import type { Loja } from '../types'
import { lojasMock } from '../mocks/lojas'
import { atraso } from './atraso'
import { obterPlano } from './plano.service'

const lojas: Loja[] = structuredClone(lojasMock)
const ERRO_LOJA = 'Não encontramos essa loja. Confira o endereço do portal com a loja ou volte à lista de lojas.'

// a loja 1 é a logada: o plano dela segue o seletor da demonstração
function comPlano(loja: Loja): Loja {
  return loja.id === 1 ? { ...loja, plano: obterPlano() } : loja
}

export async function listarLojas(): Promise<Loja[]> {
  return atraso(structuredClone(lojas.map(comPlano)))
}

export async function buscarLoja(id: number): Promise<Loja> {
  const loja = lojas.find((l) => l.id === id)
  if (!loja) throw new Error(ERRO_LOJA)
  return atraso(structuredClone(comPlano(loja)))
}

export async function buscarLojaPorSlug(slug: string): Promise<Loja> {
  const loja = lojas.find((l) => l.slug === slug)
  if (!loja) throw new Error(ERRO_LOJA)
  return atraso(structuredClone(comPlano(loja)))
}

export async function salvarLoja(id: number, dados: Pick<Loja, 'nome' | 'slug' | 'email'>): Promise<Loja> {
  const loja = lojas.find((l) => l.id === id)
  if (!loja) throw new Error(ERRO_LOJA)
  Object.assign(loja, dados)
  return atraso(structuredClone(comPlano(loja)))
}

// mock: a exclusão ainda não apaga nada
export async function excluirLoja(id: number): Promise<void> {
  return atraso(void id)
}

function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function criarLoja(nome: string): Promise<Loja> {
  const slug = gerarSlug(nome)
  const loja: Loja = {
    id: lojas.length + 1,
    nome,
    slug,
    plano: 'starter',
    email: '',
    ativa: true,
    prazoRespostaDias: 2,
    enderecoDevolucao: '',
  }
  lojas.push(loja)
  return atraso(structuredClone(loja))
}
