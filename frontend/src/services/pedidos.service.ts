import type {
  Cliente,
  DadosPedido,
  ErroLinha,
  Pedido,
  PedidoListado,
  ResultadoImportacao,
} from '../types'
import { clientesMock, pedidosMock } from '../mocks/pedidos'
import type { LinhaCsv } from '../utils/csv'
import { apenasDigitos, normalizarPedido } from '../utils/format'
import { atraso } from './atraso'
import { contagemPorPedido } from './ocorrencias.service'

// estado em memória; o backend guarda pedidos e clientes isolados por loja
const clientes: Cliente[] = structuredClone(clientesMock)
const pedidos: Pedido[] = structuredClone(pedidosMock).map((p) => ({
  ...p,
  cliente: clientes.find((c) => c.id === p.cliente.id) ?? p.cliente,
}))

function montarDetalhe(tamanho: string | undefined, quantidade: number): string {
  const un = `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}`
  return tamanho ? `Tamanho ${tamanho} • ${un}` : un
}

// o cliente é identificado pelo CPF: mesmo CPF, mesmo cliente
function upsertCliente(dados: DadosPedido): Cliente {
  const existente = clientes.find((c) => c.cpf === dados.clienteCpf)
  if (existente) {
    existente.nome = dados.clienteNome
    existente.email = dados.clienteEmail
    return existente
  }
  const novo: Cliente = {
    id: Math.max(0, ...clientes.map((c) => c.id)) + 1,
    nome: dados.clienteNome,
    email: dados.clienteEmail,
    cpf: dados.clienteCpf,
  }
  clientes.push(novo)
  return novo
}

// a chave do pedido é o número: repetir atualiza em vez de duplicar
function upsertPedido(dados: DadosPedido): { pedido: Pedido; novo: boolean } {
  const cliente = upsertCliente(dados)
  const campos = {
    cliente,
    produto: dados.produto,
    tamanho: dados.tamanho,
    quantidade: dados.quantidade,
    detalhe: montarDetalhe(dados.tamanho, dados.quantidade),
    valor: dados.valor,
    dataPedido: dados.dataPedido,
  }
  const existente = pedidos.find((p) => p.numero === dados.numero)
  if (existente) {
    Object.assign(existente, campos)
    return { pedido: existente, novo: false }
  }
  const pedido: Pedido = {
    id: Math.max(0, ...pedidos.map((p) => p.id)) + 1,
    numero: dados.numero,
    ...campos,
  }
  pedidos.push(pedido)
  return { pedido, novo: true }
}

// backend: GET /pedidos?busca=&pagina= (filtrado pela loja logada) com o total de ocorrências de cada pedido
export async function listarPedidos(): Promise<PedidoListado[]> {
  const contagem = contagemPorPedido()
  const ordenados = [...pedidos].sort((a, b) => b.dataPedido.localeCompare(a.dataPedido) || b.id - a.id)
  return atraso(structuredClone(ordenados.map((p) => ({ ...p, totalOcorrencias: contagem[p.numero] ?? 0 }))))
}

export async function buscarPedido(id: number): Promise<Pedido> {
  const pedido = pedidos.find((p) => p.id === id)
  if (!pedido) throw new Error('Não encontramos esse pedido. Volte à lista de pedidos e abra de novo.')
  return atraso(structuredClone(pedido))
}

// backend: GET /pedidos?busca= para a busca da nova ocorrência (número, nome ou CPF, no máximo ~8 resultados)
export async function buscarPedidos(termo: string): Promise<Pedido[]> {
  const t = termo.trim().toLowerCase()
  const digitos = apenasDigitos(termo)
  const achados = pedidos.filter(
    (p) =>
      p.numero.toLowerCase().includes(t) ||
      p.cliente.nome.toLowerCase().includes(t) ||
      (digitos.length >= 3 && p.cliente.cpf.includes(digitos)),
  )
  return atraso(structuredClone(achados.slice(0, 8)))
}

// backend: POST /portal/:slug/consultar-pedido (número + CPF, sempre dentro da loja do slug)
export async function localizarPedido(numero: string, cpf: string): Promise<Pedido | null> {
  const achado = pedidos.find((p) => p.numero === normalizarPedido(numero) && p.cliente.cpf === apenasDigitos(cpf))
  return atraso(achado ? structuredClone(achado) : null)
}

export async function localizarPedidoPorNumero(numero: string): Promise<Pedido | null> {
  const achado = pedidos.find((p) => p.numero === normalizarPedido(numero))
  return atraso(achado ? structuredClone(achado) : null)
}

// backend: POST /pedidos; responder 409 se o número já existir na loja e validar CPF e e-mail de novo
export async function cadastrarPedido(dados: DadosPedido): Promise<Pedido> {
  if (pedidos.some((p) => p.numero === dados.numero)) {
    throw new Error('Já existe um pedido com esse número. Use outro número ou atualize o pedido pela importação de CSV.')
  }
  return atraso(structuredClone(upsertPedido(dados).pedido))
}

// backend: a prévia pode ser feita só no front, mas o backend precisa dizer quais números já existem na loja
// (ou aceitar um dry-run: POST /pedidos/importacoes?simular=true com o arquivo)
export async function prepararImportacao(validas: LinhaCsv[], erros: ErroLinha[]): Promise<ResultadoImportacao> {
  const linhas = validas.map((l) => ({
    ...l,
    situacao: pedidos.some((p) => p.numero === l.numero) ? ('atualizar' as const) : ('novo' as const),
  }))
  return atraso({
    novos: linhas.filter((l) => l.situacao === 'novo').length,
    atualizados: linhas.filter((l) => l.situacao === 'atualizar').length,
    erros,
    linhas,
  })
}

// backend: POST /pedidos/importacoes (multipart com o arquivo, até 5 MB)
// - upsert pela chave (loja, número do pedido); importar o mesmo arquivo de novo não duplica
// - valida tudo de novo (CPF, e-mail, valor, data) e devolve {novos, atualizados, erros por linha}
// - tudo ou nada por linha: linhas com erro não impedem as válidas, mas aparecem no retorno
export async function importarPedidos(linhas: DadosPedido[]): Promise<{ novos: number; atualizados: number }> {
  let novos = 0
  let atualizados = 0
  linhas.forEach((l) => (upsertPedido(l).novo ? novos++ : atualizados++))
  return atraso({ novos, atualizados })
}

export async function buscarCliente(id: number): Promise<Cliente> {
  const cliente = clientes.find((c) => c.id === id)
  if (!cliente) throw new Error('Não encontramos esse cliente. Volte à lista de pedidos e tente de novo.')
  return atraso(structuredClone(cliente))
}

export async function listarPedidosDoCliente(clienteId: number): Promise<Pedido[]> {
  const doCliente = pedidos.filter((p) => p.cliente.id === clienteId).sort((a, b) => b.dataPedido.localeCompare(a.dataPedido))
  return atraso(structuredClone(doCliente))
}
