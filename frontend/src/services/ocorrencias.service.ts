import type {
  ContagensPainel,
  Mensagem,
  Ocorrencia,
  ResumoOcorrencias,
  StatusOcorrencia,
} from '../types'
import { adaptarMensagem, adaptarOcorrencia, statusParaBanco } from '../utils/adaptadores'
import type { LinhaMensagemApi, LinhaOcorrenciaApi } from '../utils/adaptadores'
import { normalizarProtocolo } from '../utils/format'
import { ErroApi, api } from './api'

// painel do lojista: tudo vem do backend (/api/painel), sempre dentro da loja logada

interface DetalheApi extends LinhaOcorrenciaApi {
  mensagens: LinhaMensagemApi[]
}

async function detalhe(protocolo: string): Promise<DetalheApi> {
  try {
    return await api.get<DetalheApi>(`/painel/ocorrencias/${normalizarProtocolo(protocolo)}`)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) {
      throw new Error('Não encontramos essa ocorrência. Volte à lista e abra o caso de novo.', { cause: erro })
    }
    throw erro
  }
}

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  const linhas = await api.get<LinhaOcorrenciaApi[]>('/painel/ocorrencias')
  return linhas.map(adaptarOcorrencia)
}

export async function resumoOcorrencias(): Promise<ResumoOcorrencias> {
  const itens = await listarOcorrencias()
  const conta = (s: StatusOcorrencia) => itens.filter((o) => o.status === s).length
  return {
    abertas: itens.filter((o) => o.status !== 'Concluído').length,
    novas: conta('Novo'),
    aguardandoDevolucao: conta('Aguardando devolução'),
    concluidas: conta('Concluído'),
    total: itens.length,
  }
}

export async function contagensPainel(): Promise<ContagensPainel> {
  const r = await api.get<{ novas: number; nao_lidas: number }>('/painel/contagens')
  return { novas: r.novas, naoLidas: r.nao_lidas }
}

// ocorrências abertas da loja logada (o aviso ao excluir a loja usa isto)
export async function contarAbertas(): Promise<number> {
  return (await resumoOcorrencias()).abertas
}

export async function buscarOcorrencia(protocolo: string): Promise<Ocorrencia> {
  return adaptarOcorrencia(await detalhe(protocolo))
}

// o atendente abriu o caso: tira a bolinha de "mensagem não lida"
export async function marcarComoLida(protocolo: string): Promise<void> {
  await api.post(`/painel/ocorrencias/${normalizarProtocolo(protocolo)}/lida`)
}

// inclui as notas internas, que só a equipe vê
export async function listarMensagens(protocolo: string): Promise<Mensagem[]> {
  const d = await detalhe(protocolo)
  return d.mensagens.map((m) => adaptarMensagem(m, d.cliente_nome))
}

// atualiza o histórico a cada poucos segundos; devolve a função que para de observar
export function observarMensagens(
  protocolo: string,
  aoMudar: (mensagens: Mensagem[]) => void,
  intervaloMs = 10_000,
): () => void {
  let assinatura = ''
  const id = setInterval(async () => {
    // aba em segundo plano não precisa consultar
    if (document.hidden) return
    try {
      const atuais = await listarMensagens(protocolo)
      const nova = atuais.map((m) => m.id).join(',')
      if (assinatura && nova !== assinatura) aoMudar(atuais)
      assinatura = nova
    } catch {
      // falha momentânea: tenta de novo no próximo ciclo
    }
  }, intervaloMs)
  return () => clearInterval(id)
}

export async function enviarMensagem(
  protocolo: string,
  texto: string,
  opcoes: { interna?: boolean } = {},
): Promise<Mensagem> {
  const r = await api.post<{ dados: LinhaMensagemApi }>(`/painel/ocorrencias/${normalizarProtocolo(protocolo)}/mensagens`, {
    texto,
    interna: opcoes.interna === true,
  })
  return adaptarMensagem(r.dados)
}

// a orientação de devolução vai junto e fica guardada para o portal do cliente
export async function mudarStatus(protocolo: string, status: StatusOcorrencia, orientacao?: string) {
  await api.patch(`/painel/ocorrencias/${normalizarProtocolo(protocolo)}/status`, {
    status: statusParaBanco(status),
    mensagem: orientacao,
  })
  return buscarOcorrencia(protocolo)
}

interface DadosReenvio {
  codigoRastreio: string
  itens: string
}

interface DadosEstorno {
  valor: number
  transacao?: string
  comprovante?: string
}

export async function resolverReenvio(protocolo: string, dados: DadosReenvio) {
  await api.post(`/painel/ocorrencias/${normalizarProtocolo(protocolo)}/resolver`, {
    tipo_resolucao: 'Reenvio',
    codigo_rastreio: dados.codigoRastreio,
    itens_reenviados: dados.itens,
  })
  return buscarOcorrencia(protocolo)
}

// o banco guarda um só campo de comprovante: vale o ID da transação ou o nome do arquivo anexado
export async function resolverEstorno(protocolo: string, dados: DadosEstorno) {
  await api.post(`/painel/ocorrencias/${normalizarProtocolo(protocolo)}/resolver`, {
    tipo_resolucao: 'Estorno',
    valor_estorno: dados.valor,
    comprovante_estorno: dados.transacao || dados.comprovante,
  })
  return buscarOcorrencia(protocolo)
}

// ainda simulado: depende de rotas e colunas que o backend não tem
export { calcularMetricas, contagemPorPedido, criarOcorrenciaPelaLoja } from './simulado/ocorrencias.simulado'
