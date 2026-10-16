import type { Cliente, DadosPedido, ErroLinha, Pedido, PedidoListado, ResultadoImportacao } from '../types'
import type { LinhaCsv } from '../utils/csv'
import type { LinhaPedidoApi } from '../utils/adaptadores'
import { adaptarPedido } from '../utils/adaptadores'
import { normalizarPedido } from '../utils/format'
import { cpfValido } from '../utils/cpf'
import { api } from './api'
import { listarOcorrencias } from './ocorrencias.service'

export async function listarPedidos(): Promise<PedidoListado[]> {
  const linhas = await api.get<(LinhaPedidoApi & { total_ocorrencias: number })[]>('/pedidos')
  return linhas.map(linha => ({ ...adaptarPedido(linha), totalOcorrencias: linha.total_ocorrencias }))
}

export async function buscarPedido(id: number): Promise<Pedido> {
  return adaptarPedido(await api.get<LinhaPedidoApi>(`/pedidos/${id}`))
}

export async function buscarPedidos(termo: string): Promise<Pedido[]> {
  const linhas = await api.get<LinhaPedidoApi[]>(`/pedidos?busca=${encodeURIComponent(termo)}`)
  return linhas.slice(0, 8).map(linha => adaptarPedido(linha))
}

export async function localizarPedido(numero: string, cpf: string): Promise<Pedido | null> {
  const pedidos = await buscarPedidos(normalizarPedido(numero))
  return pedidos.find(p => p.numero === normalizarPedido(numero) && p.cliente.cpf === cpf.replace(/\D/g, '')) ?? null
}

export async function localizarPedidoPorNumero(numero: string): Promise<Pedido | null> {
  return (await buscarPedidos(normalizarPedido(numero))).find(p => p.numero === normalizarPedido(numero)) ?? null
}

export async function cadastrarPedido(dados: DadosPedido): Promise<Pedido> {
  return adaptarPedido(await api.post<LinhaPedidoApi>('/pedidos', dados))
}

export async function prepararImportacao(validas: LinhaCsv[], erros: ErroLinha[]): Promise<ResultadoImportacao> {
  const pedidos = await listarPedidos()
  const errosFinais = [...erros]
  const linhas = validas.flatMap(l => {
    const existentes = pedidos.filter(p => p.numero === l.numero)
    if (existentes.some(p => p.origem === 'nuvemshop')) {
      errosFinais.push({ linha: l.linha, mensagem: 'Esse pedido é atualizado pela integração Nuvemshop.' })
      return []
    }
    return [{ ...l, situacao: existentes.length ? 'atualizar' as const : 'novo' as const }]
  })
  return { novos: linhas.filter(l => l.situacao === 'novo').length,
    atualizados: linhas.filter(l => l.situacao === 'atualizar').length, erros: errosFinais, linhas }
}

export function importarPedidos(linhas: DadosPedido[]): Promise<{ novos: number; atualizados: number }> {
  return api.post('/pedidos/importacoes', { linhas })
}

// O identificador de cliente continua sendo o pedido de referência, como no adaptador existente.
export async function buscarCliente(id: number): Promise<Cliente> {
  return (await buscarPedido(id)).cliente
}

export async function listarPedidosDoCliente(clienteId: number): Promise<Pedido[]> {
  const referencia = await buscarPedido(clienteId)
  const pedidos = await listarPedidos()
  return pedidos.filter(p => p.id === referencia.id ||
    cpfValido(referencia.cliente.cpf) && p.cliente.cpf === referencia.cliente.cpf)
}

export async function ocorrenciasDoPedido(pedidoId: number) {
  return (await listarOcorrencias()).filter(o => o.pedido.id === pedidoId)
}
