import type {
  CanalOrigem,
  ContagensPainel,
  Mensagem,
  Metricas,
  Ocorrencia,
  Pedido,
  ResumoOcorrencias,
  StatusOcorrencia,
} from '../../types'
import { mensagensMock, ocorrenciasMock } from '../../mocks/ocorrencias'
import { CANAIS } from '../../utils/canais'
import { HOJE, normalizarProtocolo } from '../../utils/format'
import { atraso } from '../atraso'
import { usuarioLogado } from '../auth.service'

// estado em memória; troque pelas chamadas da API quando o backend estiver ligado
const ocorrencias: Ocorrencia[] = structuredClone(ocorrenciasMock)
const mensagens: Record<string, Mensagem[]> = structuredClone(mensagensMock)

function agora(): string {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${HOJE}T${hh}:${mm}`
}

function registrar(protocolo: string, msg: Omit<Mensagem, 'id' | 'data'>): Mensagem {
  const nova: Mensagem = { ...msg, id: (mensagens[protocolo]?.length ?? 0) + 1, data: agora() }
  mensagens[protocolo] = [...(mensagens[protocolo] ?? []), nova]
  return nova
}

function encontrar(protocolo: string): Ocorrencia {
  const o = ocorrencias.find((x) => x.protocolo === normalizarProtocolo(protocolo))
  if (!o) throw new Error('Não encontramos essa ocorrência. Volte à lista e abra o caso de novo.')
  return o
}

// o último contato foi do cliente e a loja ainda não respondeu
function aguardaLoja(o: Ocorrencia): boolean {
  if (o.status === 'Concluído') return false
  const conversa = (mensagens[o.protocolo] ?? []).filter((m) => m.autor !== 'sistema' && !m.interna)
  return conversa.length === 0 ? o.status === 'Novo' : conversa[conversa.length - 1].autor === 'cliente'
}

function ultimaAtividade(o: Ocorrencia): string {
  const datas = (mensagens[o.protocolo] ?? []).map((m) => m.data)
  return [o.abertaEm, ...datas].sort().at(-1) ?? o.abertaEm
}

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  return atraso(
    structuredClone(
      ocorrencias.map((o) => ({ ...o, aguardandoLoja: aguardaLoja(o), ultimaAtividade: ultimaAtividade(o) })),
    ),
  )
}

// mock: total de ocorrências por número de pedido; no backend isso vem na listagem de pedidos
export function contagemPorPedido(): Record<string, number> {
  const contagem: Record<string, number> = {}
  ocorrencias.forEach((o) => (contagem[o.pedido.numero] = (contagem[o.pedido.numero] ?? 0) + 1))
  return contagem
}

export async function resumoOcorrencias(): Promise<ResumoOcorrencias> {
  const conta = (s: StatusOcorrencia) => ocorrencias.filter((o) => o.status === s).length
  return atraso({
    abertas: ocorrencias.filter((o) => o.status !== 'Concluído').length,
    novas: conta('Novo'),
    aguardandoDevolucao: conta('Aguardando devolução'),
    concluidas: conta('Concluído'),
    total: ocorrencias.length,
  })
}

// backend: devolver {novas, naoLidas} do painel da loja logada (status = Novo e mensagens do cliente sem leitura)
export async function contagensPainel(): Promise<ContagensPainel> {
  return atraso({
    novas: ocorrencias.filter((o) => o.status === 'Novo').length,
    naoLidas: ocorrencias.filter((o) => o.naoLida).length,
  })
}

// mock: só a primeira loja tem casos; o backend filtra por loja
export async function contarAbertas(lojaId: number): Promise<number> {
  return atraso(lojaId === 1 ? ocorrencias.filter((o) => o.status !== 'Concluído').length : 0)
}

export async function buscarOcorrencia(protocolo: string): Promise<Ocorrencia> {
  return atraso(structuredClone(encontrar(protocolo)))
}

// backend: marcar como lidas as mensagens do cliente quando um atendente abre o caso
export async function marcarComoLida(protocolo: string): Promise<void> {
  encontrar(protocolo).naoLida = false
}

function filtrar(protocolo: string, incluirInternas: boolean): Mensagem[] {
  const todas = mensagens[encontrar(protocolo).protocolo] ?? []
  return incluirInternas ? todas : todas.filter((m) => !m.interna)
}

// o portal do cliente nunca recebe notas internas (incluirInternas = false)
export async function listarMensagens(protocolo: string, incluirInternas = true): Promise<Mensagem[]> {
  return atraso(structuredClone(filtrar(protocolo, incluirInternas)))
}

// backend: trocar o setInterval por GET /mensagens?desde=<último id> (ou SSE/WebSocket)
// devolve a função para parar de observar
export function observarMensagens(
  protocolo: string,
  aoMudar: (mensagens: Mensagem[]) => void,
  incluirInternas = true,
  intervaloMs = 10_000,
): () => void {
  let assinatura = JSON.stringify(filtrar(protocolo, incluirInternas).map((m) => m.id))
  const id = setInterval(() => {
    const atuais = filtrar(protocolo, incluirInternas)
    const nova = JSON.stringify(atuais.map((m) => m.id))
    if (nova !== assinatura) {
      assinatura = nova
      aoMudar(structuredClone(atuais))
    }
  }, intervaloMs)
  return () => clearInterval(id)
}

export async function enviarMensagem(
  protocolo: string,
  texto: string,
  autor: 'cliente' | 'loja',
  opcoes: { anexo?: string; interna?: boolean } = {},
): Promise<Mensagem> {
  const o = encontrar(protocolo)
  const nome = autor === 'loja' ? (o.responsavel ?? 'Atendimento') : o.pedido.cliente.nome
  if (autor === 'cliente') o.naoLida = true
  return atraso(registrar(o.protocolo, { autor, nome, texto, ...opcoes }))
}

const eventos: Partial<Record<StatusOcorrencia, string>> = {
  'Aguardando devolução': 'Devolução solicitada ao cliente',
  'Reenvio solicitado': 'Reenvio solicitado',
  'Estorno solicitado': 'Estorno solicitado',
}

export async function mudarStatus(protocolo: string, status: StatusOcorrencia, orientacao?: string) {
  const o = encontrar(protocolo)
  o.status = status
  const texto =
    status === 'Em triagem' ? `${(o.responsavel ?? 'Atendimento').split(' ')[0]} iniciou a triagem` : eventos[status]
  if (texto) registrar(o.protocolo, { autor: 'sistema', nome: 'Sistema', texto })
  if (orientacao) {
    o.orientacaoDevolucao = orientacao
    registrar(o.protocolo, { autor: 'loja', nome: o.responsavel ?? 'Atendimento', texto: orientacao })
  }
  return atraso(structuredClone(o))
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
  const o = encontrar(protocolo)
  o.status = 'Concluído'
  o.resolucao = { tipo: 'Reenvio', ...dados, concluidoEm: agora() }
  registrar(o.protocolo, { autor: 'sistema', nome: 'Sistema', texto: 'Reenvio registrado e caso concluído' })
  return atraso(structuredClone(o))
}

export async function resolverEstorno(protocolo: string, dados: DadosEstorno) {
  const o = encontrar(protocolo)
  o.status = 'Concluído'
  o.resolucao = { tipo: 'Estorno', ...dados, concluidoEm: agora() }
  registrar(o.protocolo, { autor: 'sistema', nome: 'Sistema', texto: 'Estorno registrado e caso concluído' })
  return atraso(structuredClone(o))
}

function gerarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_')
}

// token válido por 30 dias
function validadeToken(): string {
  const [ano, mes, dia] = HOJE.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + 30)).toISOString().slice(0, 10)
}

function novaOcorrencia(pedido: Pedido, motivo: string, descricao: string, canal: CanalOrigem): Ocorrencia {
  const ocorrencia: Ocorrencia = {
    id: ocorrencias.length + 1,
    protocolo: `POS-${1001 + ocorrencias.length}`,
    status: 'Novo',
    motivo,
    descricao,
    pedido,
    abertaEm: agora(),
    responsavel: usuarioLogado()?.nome ?? 'Mariana Silva',
    canal,
    token: gerarToken(),
    tokenExpiraEm: validadeToken(),
  }
  ocorrencias.unshift(ocorrencia)
  return ocorrencia
}

// backend: POST /portal/:slug/ocorrencias
// gera o protocolo e o token do link, grava o canal "portal" e dispara o e-mail com /portal/:slug/caso/:token
export async function criarOcorrencia(pedido: Pedido, motivo: string, descricao: string, anexo?: string) {
  const ocorrencia = novaOcorrencia(pedido, motivo, descricao, 'portal')
  ocorrencia.naoLida = true
  registrar(ocorrencia.protocolo, { autor: 'cliente', nome: pedido.cliente.nome, texto: descricao, anexo })
  return atraso(structuredClone(ocorrencia))
}

interface DadosContato {
  motivo: string
  canal: CanalOrigem
  relato: string
  primeiraMensagem: string
}

// backend: POST /painel/ocorrencias (só plano Business; 403 nos outros, via requirePlan)
// - cria a ocorrência com o canal informado, o relato como nota interna e a primeira mensagem para o cliente
// - registra o evento "Ocorrência aberta pela loja" e gera o token do link de acompanhamento
// - dispara o e-mail ao cliente com o link /portal/:slug/caso/:token (o token não pode ser adivinhável)
export async function criarOcorrenciaPelaLoja(pedido: Pedido, dados: DadosContato): Promise<Ocorrencia> {
  const ocorrencia = novaOcorrencia(pedido, dados.motivo, dados.relato, dados.canal)
  // a loja já está atendendo, então o caso nasce em triagem
  ocorrencia.status = 'Em triagem'
  const { protocolo } = ocorrencia
  const responsavel = ocorrencia.responsavel ?? 'Atendimento'
  registrar(protocolo, {
    autor: 'sistema',
    nome: 'Sistema',
    texto: `Ocorrência aberta pela loja • Canal: ${CANAIS[dados.canal]}`,
  })
  registrar(protocolo, {
    autor: 'loja',
    nome: responsavel,
    texto: `Relato do cliente (registrado pela loja): ${dados.relato}`,
    interna: true,
  })
  registrar(protocolo, { autor: 'loja', nome: responsavel, texto: dados.primeiraMensagem })
  return atraso(structuredClone(ocorrencia))
}

// backend: GET /portal/:slug/caso/:token (público, sem login)
// - o token é aleatório e expira; responder 404 para inexistente e 410 para expirado
// - nunca devolver notas internas nem dados de outras lojas
export async function buscarPorToken(token: string): Promise<Ocorrencia> {
  const o = ocorrencias.find((x) => x.token === token)
  if (!o) {
    throw new Error('Este link não é válido. Confira se copiou o endereço inteiro do e-mail, ou consulte seu pedido abaixo.')
  }
  if (o.tokenExpiraEm < HOJE) {
    throw new Error('Este link expirou. Consulte seu pedido abaixo para acompanhar a solicitação.')
  }
  return atraso(structuredClone(o))
}

function minutos(iso: string): number {
  const [data, hora] = iso.split('T')
  const [ano, mes, dia] = data.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  return Date.UTC(ano, mes - 1, dia, hh, mm) / 60000
}

function contar(itens: string[]) {
  const mapa = new Map<string, number>()
  itens.forEach((i) => mapa.set(i, (mapa.get(i) ?? 0) + 1))
  return [...mapa].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor)
}

// mock: calculado sobre os dados em memória; no backend isso é agregação no banco
export function calcularMetricas(): Metricas {
  const esperas = ocorrencias.flatMap((o) => {
    const resposta = (mensagens[o.protocolo] ?? []).find((m) => m.autor === 'loja' && !m.interna)
    // casos abertos pela loja já nascem respondidos; só conta quem começou com o cliente
    if (!resposta || o.canal !== 'portal') return []
    return [Math.max(0, minutos(resposta.data) - minutos(o.abertaEm))]
  })
  return {
    abertas: ocorrencias.filter((o) => o.status !== 'Concluído').length,
    tempoMedioPrimeiraResposta: esperas.length ? Math.round(esperas.reduce((a, b) => a + b, 0) / esperas.length) : null,
    taxaResolucao: ocorrencias.length
      ? Math.round((ocorrencias.filter((o) => o.status === 'Concluído').length / ocorrencias.length) * 100)
      : 0,
    porMotivo: contar(ocorrencias.map((o) => o.motivo)),
    porCanal: contar(ocorrencias.map((o) => CANAIS[o.canal])),
  }
}
