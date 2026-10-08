import type {
  CanalOrigem,
  Loja,
  Mensagem,
  Ocorrencia,
  Pedido,
  Plano,
  StatusOcorrencia,
} from '../types'
import { CANAIS } from './canais'
import { montarDetalhe } from './format'

// traduz o que o backend devolve (snake_case, status com outra grafia) para os tipos do front

const STATUS_DO_BANCO: Record<string, StatusOcorrencia> = {
  Novo: 'Novo',
  'Em Triagem': 'Em triagem',
  'Aguardando Devolução': 'Aguardando devolução',
  'Reenvio Solicitado': 'Reenvio solicitado',
  'Estorno Solicitado': 'Estorno solicitado',
  Concluído: 'Concluído',
}

const STATUS_PARA_BANCO: Record<StatusOcorrencia, string> = {
  Novo: 'Novo',
  'Em triagem': 'Em Triagem',
  'Aguardando devolução': 'Aguardando Devolução',
  'Reenvio solicitado': 'Reenvio Solicitado',
  'Estorno solicitado': 'Estorno Solicitado',
  Concluído: 'Concluído',
}

export function statusDoBanco(status: string): StatusOcorrencia {
  return STATUS_DO_BANCO[status] ?? 'Novo'
}

export function statusParaBanco(status: StatusOcorrencia): string {
  return STATUS_PARA_BANCO[status]
}

// "2026-10-06 10:30:00.123" -> "2026-10-06T10:30"
export function dataHora(valor: string | null | undefined): string {
  if (!valor) return ''
  return valor.replace(' ', 'T').slice(0, 16)
}

export function planoDoBanco(valor: string | null | undefined): Plano {
  const p = String(valor ?? '').toLowerCase()
  return p === 'pro' || p === 'business' ? p : 'starter'
}

// "Vestido Midi - Tam M (2 un.)" -> nome, tamanho e quantidade
function separarProduto(texto: string) {
  const m = texto.match(/^(.*?)(?: - Tam (.+?))?(?: \((\d+) un\.\))?$/)
  return {
    produto: m?.[1] ?? texto,
    tamanho: m?.[2] || undefined,
    quantidade: m?.[3] ? Number(m[3]) : 1,
  }
}

export interface LinhaPedidoApi {
  pedido_id?: number
  numero_pedido: string
  cliente_nome: string
  cliente_email?: string
  cliente_cpf?: string
  produto: string
  // a consulta do portal devolve "valor"; o painel devolve "pedido_valor"
  valor?: string | number
  pedido_valor?: string | number
  data_compra?: string
}

export function adaptarPedido(linha: LinhaPedidoApi, cpfDigitado = ''): Pedido {
  const { produto, tamanho, quantidade } = separarProduto(linha.produto)
  return {
    id: linha.pedido_id ?? 0,
    numero: linha.numero_pedido,
    // ainda não há tabela de clientes; o id é o do pedido
    cliente: {
      id: linha.pedido_id ?? 0,
      nome: linha.cliente_nome,
      email: linha.cliente_email ?? '',
      cpf: (linha.cliente_cpf ?? cpfDigitado).replace(/\D/g, ''),
    },
    produto,
    tamanho,
    quantidade,
    detalhe: montarDetalhe(tamanho, quantidade),
    valor: Number(linha.pedido_valor ?? linha.valor ?? 0),
    dataPedido: (linha.data_compra ?? '').slice(0, 10),
  }
}

export interface LinhaOcorrenciaApi extends LinhaPedidoApi {
  id?: number
  protocolo: string
  status: string
  motivo: string
  descricao?: string
  criado_em: string
  concluido_em?: string | null
  tipo_resolucao?: 'Reenvio' | 'Estorno' | null
  codigo_rastreio?: string | null
  itens_reenviados?: string | null
  valor_estorno?: string | number | null
  comprovante_estorno?: string | null
  canal?: string
  responsavel?: string | null
  nao_lida?: boolean
  orientacao_devolucao?: string | null
  ultima_atividade?: string | null
  ultimo_autor?: string
}

export function adaptarOcorrencia(linha: LinhaOcorrenciaApi): Ocorrencia {
  const status = statusDoBanco(linha.status)
  const canal = (linha.canal && linha.canal in CANAIS ? linha.canal : 'portal') as CanalOrigem

  return {
    id: linha.id ?? 0,
    protocolo: linha.protocolo,
    status,
    motivo: linha.motivo,
    descricao: linha.descricao ?? '',
    pedido: adaptarPedido(linha),
    abertaEm: dataHora(linha.criado_em),
    responsavel: linha.responsavel ?? undefined,
    canal,
    // o token do link de acompanhamento ainda não existe no banco
    token: '',
    tokenExpiraEm: '',
    resolucao: linha.tipo_resolucao
      ? {
          tipo: linha.tipo_resolucao,
          codigoRastreio: linha.codigo_rastreio ?? undefined,
          itens: linha.itens_reenviados ?? undefined,
          valor: linha.valor_estorno != null ? Number(linha.valor_estorno) : undefined,
          transacao: linha.comprovante_estorno ?? undefined,
          concluidoEm: dataHora(linha.concluido_em ?? linha.criado_em),
        }
      : undefined,
    orientacaoDevolucao: linha.orientacao_devolucao ?? undefined,
    naoLida: Boolean(linha.nao_lida),
    aguardandoLoja: status !== 'Concluído' && (linha.ultimo_autor === 'cliente' || (linha.ultimo_autor === '' && status === 'Novo')),
    ultimaAtividade: dataHora(linha.ultima_atividade ?? linha.criado_em),
  }
}

export interface LinhaMensagemApi {
  id: number
  autor: 'cliente' | 'atendente' | 'sistema'
  autor_nome?: string | null
  texto: string
  enviado_em: string
  interna?: boolean
}

export function adaptarMensagem(linha: LinhaMensagemApi, nomeCliente = 'Cliente'): Mensagem {
  const autor = linha.autor === 'atendente' ? 'loja' : linha.autor
  const padrao = autor === 'cliente' ? nomeCliente : autor === 'sistema' ? 'Sistema' : 'Atendimento'
  return {
    id: linha.id,
    autor,
    nome: linha.autor_nome || padrao,
    texto: linha.texto,
    data: dataHora(linha.enviado_em),
    interna: linha.interna ? true : undefined,
  }
}

export interface LinhaLojaApi {
  id: number
  nome: string
  slug: string
  email: string
  plano?: string
  prazo_resposta_dias?: number
  endereco_devolucao?: string
}

export function adaptarLoja(linha: LinhaLojaApi): Loja {
  return {
    id: linha.id,
    nome: linha.nome,
    slug: linha.slug,
    plano: planoDoBanco(linha.plano),
    email: linha.email,
    ativa: true,
    prazoRespostaDias: linha.prazo_resposta_dias ?? 2,
    enderecoDevolucao: linha.endereco_devolucao ?? '',
  }
}
