import type { FichaCliente } from '../types'
import { atraso } from './atraso'
import { listarOcorrencias } from './ocorrencias.service'
import { buscarCliente, listarPedidosDoCliente } from './pedidos.service'

// backend: GET /clientes/:id (só plano Business; responder 403 nos outros, via requirePlan)
// devolve o cliente, os pedidos e as ocorrências dele, sempre dentro da loja logada
// totalPedidos, totalOcorrencias e ultimaInteracao (última mensagem ou evento) podem vir calculados
export async function fichaDoCliente(id: number): Promise<FichaCliente> {
  const [cliente, pedidos, todas] = await Promise.all([
    buscarCliente(id),
    listarPedidosDoCliente(id),
    listarOcorrencias(),
  ])
  const ocorrencias = todas
    .filter((o) => o.pedido.cliente.id === id)
    .sort((a, b) => b.abertaEm.localeCompare(a.abertaEm))

  const datas = [...pedidos.map((p) => p.dataPedido), ...ocorrencias.map((o) => o.ultimaAtividade ?? o.abertaEm)]
  const ultimaInteracao = datas.sort().at(-1) ?? ''

  return atraso({
    cliente,
    pedidos,
    ocorrencias,
    totalPedidos: pedidos.length,
    totalOcorrencias: ocorrencias.length,
    ultimaInteracao,
  })
}
