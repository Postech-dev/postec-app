import type { Mensagem, Ocorrencia, Pedido } from '../types'
import { buscarLojaPorSlug } from './lojas.service'
import {
  buscarOcorrencia,
  buscarPorToken,
  criarOcorrencia,
  enviarMensagem,
  listarMensagens,
  observarMensagens,
} from './ocorrencias.service'
import { localizarPedido, localizarPedidoPorNumero } from './pedidos.service'

export const MOTIVOS = ['Produto com defeito', 'Arrependimento', 'Tamanho incorreto', 'Atraso de entrega']

export async function consultarPedido(slug: string, numero: string, cpf: string): Promise<Pedido> {
  await buscarLojaPorSlug(slug)
  const pedido = await localizarPedido(numero, cpf)
  // sempre a mesma mensagem, para não revelar se o número existe com outro CPF
  if (!pedido) throw new Error('Não encontramos um pedido com esses dados. Confira o número e o CPF.')
  return pedido
}

export async function abrirOcorrencia(
  slug: string,
  numeroPedido: string,
  motivo: string,
  descricao: string,
  anexo?: string,
): Promise<Ocorrencia> {
  await buscarLojaPorSlug(slug)
  const pedido = await localizarPedidoPorNumero(numeroPedido)
  if (!pedido) throw new Error('Não encontramos o pedido. Volte e consulte a compra de novo.')
  return criarOcorrencia(pedido, motivo, descricao, anexo)
}

// backend: GET /portal/:slug/ocorrencias/:protocolo precisa exigir protocolo + CPF (ou só o token do e-mail)
// protocolo sequencial (POS-1001, POS-1002...) dá para enumerar: sem o CPF, qualquer pessoa lê o caso de outro cliente
export async function acompanharOcorrencia(slug: string, protocolo: string): Promise<Ocorrencia> {
  await buscarLojaPorSlug(slug)
  try {
    return await buscarOcorrencia(protocolo)
  } catch {
    throw new Error('Não encontramos uma solicitação com esse protocolo. Confira o código que chegou no seu e-mail (ex.: POS-1001).')
  }
}

// link do e-mail: abre o acompanhamento direto, sem pedir protocolo e CPF
export async function acompanharPorToken(slug: string, token: string): Promise<Ocorrencia> {
  await buscarLojaPorSlug(slug)
  return buscarPorToken(token)
}

// o cliente só vê mensagens da loja e dele mesmo, nunca notas internas
export async function listarMensagensPortal(protocolo: string): Promise<Mensagem[]> {
  return listarMensagens(protocolo, false)
}

export function observarMensagensPortal(protocolo: string, aoMudar: (m: Mensagem[]) => void): () => void {
  return observarMensagens(protocolo, aoMudar, false)
}

export async function responderSolicitacao(protocolo: string, texto: string, anexo?: string): Promise<Mensagem> {
  return enviarMensagem(protocolo, texto, 'cliente', { anexo })
}

// backend: incluir este link no e-mail de confirmação (precisa do slug da loja e do token da ocorrência)
// o link usa o token, não o protocolo, para não poder ser adivinhado
export function gerarLinkAcompanhamento(slug: string, token: string): string {
  return `${window.location.origin}/portal/${slug}/caso/${token}`
}
