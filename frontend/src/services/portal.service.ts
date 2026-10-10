import type { Mensagem, Ocorrencia, Pedido } from '../types'
import { adaptarMensagem, adaptarOcorrencia, adaptarPedido } from '../utils/adaptadores'
import type { LinhaMensagemApi, LinhaOcorrenciaApi, LinhaPedidoApi } from '../utils/adaptadores'
import { normalizarPedido, normalizarProtocolo } from '../utils/format'
import { ErroApi, api } from './api'

export const MOTIVOS = ['Produto com defeito', 'Arrependimento', 'Tamanho incorreto', 'Atraso de entrega']

const PUBLICO = { publico: true }

// sempre a mesma mensagem, exista o número com outro CPF ou não
const ERRO_PEDIDO = 'Não encontramos um pedido com esses dados. Confira o número e o CPF.'
const ERRO_PROTOCOLO =
  'Não encontramos uma solicitação com esse protocolo. Confira o código que chegou no seu e-mail (ex.: POS-1001).'

export async function consultarPedido(slug: string, numero: string, cpf: string): Promise<Pedido> {
  try {
    const linha = await api.post<LinhaPedidoApi>(
      `/portal/${encodeURIComponent(slug)}/consultar-pedido`,
      { numero_pedido: normalizarPedido(numero), cpf },
      PUBLICO,
    )
    return adaptarPedido(linha, cpf)
  } catch (erro) {
    if (erro instanceof ErroApi && (erro.status === 404 || erro.status === 400)) throw new Error(ERRO_PEDIDO, { cause: erro })
    throw erro
  }
}

export async function abrirOcorrencia(
  slug: string,
  pedidoId: number,
  motivo: string,
  descricao: string,
): Promise<{ protocolo: string }> {
  return api.post<{ protocolo: string }>(
    `/portal/${encodeURIComponent(slug)}/ocorrencias`,
    { pedido_id: pedidoId, motivo, descricao },
    PUBLICO,
  )
}

interface DetalhePortalApi extends LinhaOcorrenciaApi {
  mensagens: LinhaMensagemApi[]
}

async function buscar(caminho: string, mensagemNaoEncontrada: string): Promise<DetalhePortalApi> {
  try {
    return await api.get<DetalhePortalApi>(caminho, PUBLICO)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) throw new Error(mensagemNaoEncontrada, { cause: erro })
    throw erro
  }
}

// protocolo + e-mail via formulário: par validado para não enumerar casos de outros clientes
// sem e-mail: acesso interno (vindo de navegação já autenticada ou link com token)
export async function acompanharOcorrencia(slug: string, protocolo: string, email?: string): Promise<Ocorrencia> {
  const norm = normalizarProtocolo(protocolo)
  if (email) {
    // formulário externo: POST exige par protocolo+email no backend
    try {
      const linha = await api.post<DetalhePortalApi>(
        `/portal/${encodeURIComponent(slug)}/acompanhar`,
        { protocolo: norm, email },
        PUBLICO,
      )
      return adaptarOcorrencia(linha)
    } catch (erro) {
      if (erro instanceof ErroApi && (erro.status === 404 || erro.status === 400)) throw new Error(ERRO_PROTOCOLO, { cause: erro })
      throw erro
    }
  }
  // acesso interno: GET direto pelo protocolo (rota já existente)
  const caminho = `/portal/${encodeURIComponent(slug)}/ocorrencias/${encodeURIComponent(norm)}`
  return adaptarOcorrencia(await buscar(caminho, ERRO_PROTOCOLO))
}

// link do e-mail: abre o acompanhamento direto, sem pedir protocolo e CPF
// backend: GET /portal/:slug/caso/:token (404 inexistente, 410 expirado); ainda não existe, então o link vale como inválido
export async function acompanharPorToken(slug: string, token: string): Promise<Ocorrencia> {
  const caminho = `/portal/${encodeURIComponent(slug)}/caso/${encodeURIComponent(token)}`
  try {
    return adaptarOcorrencia(await api.get<DetalhePortalApi>(caminho, PUBLICO))
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 410) {
      throw new Error('Este link expirou. Consulte seu pedido abaixo para acompanhar a solicitação.', { cause: erro })
    }
    if (erro instanceof ErroApi && erro.status === 404) {
      throw new Error('Este link não é válido. Confira se copiou o endereço inteiro do e-mail, ou consulte seu pedido abaixo.', { cause: erro })
    }
    throw erro
  }
}

// o cliente só vê mensagens da loja e dele mesmo: o backend nunca devolve notas internas
export async function listarMensagensPortal(slug: string, protocolo: string): Promise<Mensagem[]> {
  const caminho = `/portal/${encodeURIComponent(slug)}/ocorrencias/${encodeURIComponent(normalizarProtocolo(protocolo))}`
  const d = await buscar(caminho, ERRO_PROTOCOLO)
  return d.mensagens.map((m) => adaptarMensagem(m, d.cliente_nome))
}

// atualiza o histórico a cada poucos segundos; devolve a função que para de observar
export function observarMensagensPortal(
  slug: string,
  protocolo: string,
  aoMudar: (m: Mensagem[]) => void,
  intervaloMs = 10_000,
): () => void {
  let assinatura = ''
  const id = setInterval(async () => {
    if (document.hidden) return
    try {
      const atuais = await listarMensagensPortal(slug, protocolo)
      const nova = atuais.map((m) => m.id).join(',')
      if (assinatura && nova !== assinatura) aoMudar(atuais)
      assinatura = nova
    } catch {
      // falha momentânea: tenta de novo no próximo ciclo
    }
  }, intervaloMs)
  return () => clearInterval(id)
}

export async function responderSolicitacao(slug: string, protocolo: string, texto: string): Promise<Mensagem> {
  const linha = await api.post<LinhaMensagemApi>(
    `/portal/${encodeURIComponent(slug)}/ocorrencias/${encodeURIComponent(normalizarProtocolo(protocolo))}/mensagens`,
    { texto },
    PUBLICO,
  )
  return adaptarMensagem(linha)
}

// backend: incluir este link no e-mail de confirmação (precisa do slug da loja e do token da ocorrência)
// o link usa o token, não o protocolo, para não poder ser adivinhado
export function gerarLinkAcompanhamento(slug: string, token: string): string {
  return `${window.location.origin}/portal/${slug}/caso/${token}`
}
