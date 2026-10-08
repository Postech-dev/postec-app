import Papa from 'papaparse'
import type { DadosPedido, ErroLinha } from '../types'
import { cpfValido, normalizarCpf } from './cpf'
import { lerValor } from './format'

export const COLUNAS = [
  'numero_pedido',
  'cliente_nome',
  'cliente_email',
  'cliente_cpf',
  'produto',
  'tamanho',
  'quantidade',
  'valor',
  'data_pedido',
] as const

const OBRIGATORIAS = COLUNAS.filter((c) => c !== 'tamanho')

export const LIMITE_CSV_MB = 5

// caractere de substituição que o UTF-8 gera quando o arquivo não é UTF-8
const SUBSTITUICAO = '\uFFFD'
// marca de ordem de bytes que o Excel coloca no início do UTF-8
const BOM = '\uFEFF'

// lê como UTF-8; se o Excel salvou em ANSI (aparece o caractere de substituição), tenta de novo em windows-1252
export async function lerArquivoCsv(arquivo: File): Promise<string> {
  const bytes = await arquivo.arrayBuffer()
  return decodificarCsv(bytes)
}

export function decodificarCsv(bytes: ArrayBuffer): string {
  let texto = new TextDecoder('utf-8').decode(bytes)
  if (texto.includes(SUBSTITUICAO)) texto = new TextDecoder('windows-1252').decode(bytes)
  return texto.startsWith(BOM) ? texto.slice(1) : texto
}

// devolve a mensagem de erro, ou vazio se o arquivo pode ser lido
export function validarArquivoCsv(arquivo: File): string {
  if (!arquivo.name.toLowerCase().endsWith('.csv')) {
    return 'Esse arquivo não é um .csv. No Excel, use "Salvar como" e escolha "CSV (separado por vírgulas)".'
  }
  if (arquivo.size > LIMITE_CSV_MB * 1024 * 1024) {
    return `O arquivo passa de ${LIMITE_CSV_MB} MB. Divida a planilha em partes menores e importe uma de cada vez.`
  }
  if (arquivo.size === 0) return 'O arquivo está vazio. Preencha a planilha modelo e tente de novo.'
  return ''
}

// aceita DD/MM/AAAA e AAAA-MM-DD; nunca formato americano
export function lerData(texto: string): string | null {
  const t = texto.trim()
  let ano: number, mes: number, dia: number
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (br) [dia, mes, ano] = [Number(br[1]), Number(br[2]), Number(br[3])]
  else if (iso) [ano, mes, dia] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  else return null
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  const existe = data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  if (!existe) return null
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export interface LinhaCsv extends DadosPedido {
  linha: number
}

export interface AnaliseCsv {
  validas: LinhaCsv[]
  erros: ErroLinha[]
}

const EMAIL = /^\S+@\S+\.\S+$/

// valida o CSV inteiro no front, só para a prévia; o backend valida de novo na importação
export function analisarCsv(texto: string): AnaliseCsv {
  const lido = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const colunas = lido.meta.fields ?? []
  const faltando = OBRIGATORIAS.filter((c) => !colunas.includes(c))
  if (faltando.length > 0) {
    return {
      validas: [],
      erros: [
        {
          linha: 0,
          mensagem: `Faltam colunas na planilha: ${faltando.join(', ')}. Baixe o modelo e use o mesmo cabeçalho.`,
        },
      ],
    }
  }
  if (lido.data.length === 0) {
    return { validas: [], erros: [{ linha: 0, mensagem: 'A planilha não tem nenhuma linha de pedido.' }] }
  }

  const validas: LinhaCsv[] = []
  const erros: ErroLinha[] = []
  const vistos = new Map<string, number>()

  lido.data.forEach((registro, i) => {
    // linha 1 é o cabeçalho
    const linha = i + 2
    const campo = (nome: string) => (registro[nome] ?? '').trim()
    const problemas: string[] = []

    const numero = campo('numero_pedido').toUpperCase()
    if (!numero) problemas.push('número do pedido em branco')
    else if (vistos.has(numero)) problemas.push(`número do pedido repetido (já aparece na linha ${vistos.get(numero)})`)
    else vistos.set(numero, linha)

    const nome = campo('cliente_nome')
    if (!nome) problemas.push('nome do cliente em branco')

    const email = campo('cliente_email')
    if (!EMAIL.test(email)) problemas.push('e-mail inválido')

    const cpf = normalizarCpf(campo('cliente_cpf'))
    if (!cpfValido(cpf)) problemas.push('CPF inválido')

    const produto = campo('produto')
    if (!produto) problemas.push('produto em branco')

    const quantidade = Number(campo('quantidade'))
    if (!Number.isInteger(quantidade) || quantidade < 1) problemas.push('quantidade deve ser um número inteiro maior que zero')

    const valor = lerValor(campo('valor'))
    if (!(valor > 0)) problemas.push('valor inválido (use 189,90 ou 1.234,56)')

    const dataPedido = lerData(campo('data_pedido'))
    if (!dataPedido) problemas.push('data inválida (use DD/MM/AAAA ou AAAA-MM-DD)')

    if (problemas.length > 0) {
      erros.push({ linha, mensagem: problemas.join('; ') })
      return
    }

    validas.push({
      linha,
      numero,
      clienteNome: nome,
      clienteEmail: email.toLowerCase(),
      clienteCpf: cpf,
      produto,
      tamanho: campo('tamanho') || undefined,
      quantidade,
      valor,
      dataPedido: dataPedido!,
    })
  })

  return { validas, erros }
}

// planilha modelo: separador ; e BOM para o Excel em português abrir certo
export function gerarModeloCsv(): string {
  const linhas = [
    COLUNAS.join(';'),
    'PED-201;Maria Souza;maria.souza@email.com;987.654.321-00;Vestido Midi Linho Cru;M;1;189,90;06/10/2026',
    'PED-202;João Pereira;joao.pereira@email.com;321.654.987-91;Camisa Social Slim;G;2;1.259,80;2026-10-05',
  ]
  return `${BOM}${linhas.join('\r\n')}\r\n`
}

export function baixarModeloCsv(): void {
  const blob = new Blob([gerarModeloCsv()], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'modelo-pedidos-postec.csv'
  link.click()
  URL.revokeObjectURL(url)
}
