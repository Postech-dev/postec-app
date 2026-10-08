// data de hoje (AAAA-MM-DD) no fuso do navegador; os "Hoje 10:30" e "há 2 dias" partem dela
function hojeLocal(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export const HOJE = hojeLocal()

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function partes(iso: string) {
  const [data, hora = ''] = iso.split('T')
  const [, mes, dia] = data.split('-')
  return { data, hora: hora.slice(0, 5), dia, mes: MESES[Number(mes) - 1] }
}

// "Hoje 10:30" ou "05 out. 14:20"
export function formatarAbertura(iso: string): string {
  const { data, hora, dia, mes } = partes(iso)
  return data === HOJE ? `Hoje ${hora}` : `${dia} ${mes} ${hora}`
}

// "06 out. 2026"
export function formatarData(iso: string): string {
  const { data, dia, mes } = partes(iso)
  return `${dia} ${mes} ${data.slice(0, 4)}`
}

// "06 out. 2026, às 10:30"
export function formatarDataHora(iso: string): string {
  return `${formatarData(iso)}, às ${partes(iso).hora}`
}

export function formatarHora(iso: string): string {
  return partes(iso).hora
}

// "Terça-feira, 06 out. 2026"
export function formatarDiaCompleto(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const semana = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${formatarData(iso)}`
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

export function formatarCpf(texto: string): string {
  const d = apenasDigitos(texto).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

// "ocorrência" / "ocorrências"
export function pluralOcorrencias(qtd: number): string {
  return `${qtd} ${qtd === 1 ? 'ocorrência' : 'ocorrências'}`
}

const MESES_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// "Hoje, 06 de outubro" ou "05 de outubro"
export function formatarSeparadorDia(iso: string): string {
  const [data] = iso.split('T')
  const [, mes, dia] = data.split('-')
  const texto = `${dia} de ${MESES_EXTENSO[Number(mes) - 1]}`
  return data === HOJE ? `Hoje, ${texto}` : texto
}

// "Tamanho M • 2 unidades" (ou só "1 unidade" quando não há tamanho)
export function montarDetalhe(tamanho: string | undefined, quantidade: number): string {
  const un = `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}`
  return tamanho ? `Tamanho ${tamanho} • ${un}` : un
}

// "Tamanho M • 1 unidade" -> "Tam. M"
export function tamanhoCurto(detalhe: string): string {
  return detalhe.split(' • ')[0].replace('Tamanho', 'Tam.')
}

export function diaDe(iso: string): string {
  return iso.split('T')[0]
}

// "189,90", "189.90" ou "R$ 1.234,56" -> número; NaN se inválido
// com vírgula, a vírgula é o decimal e os pontos são milhar; só com ponto, o ponto é o decimal
export function lerValor(texto: string): number {
  const limpo = texto.replace(/[^\d,.]/g, '')
  if (!limpo) return NaN
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : NaN
}

// "ped 101", "PED-101" ou "ped101" -> "PED-101"
export function normalizarPedido(texto: string): string {
  const m = texto.trim().match(/^PED[\s-]?(\d+)$/i)
  return m ? `PED-${m[1]}` : texto.trim().toUpperCase()
}

// "pos 1001", "POS-1001" ou "pos1001" -> "POS-1001"
export function normalizarProtocolo(texto: string): string {
  const m = texto.trim().match(/^POS[\s-]?(\d+)$/i)
  return m ? `POS-${m[1]}` : texto.trim().toUpperCase()
}

function diasEntre(isoA: string, isoB: string): number {
  const [a, b] = [isoA, isoB].map((i) => {
    const [ano, mes, dia] = i.split('T')[0].split('-').map(Number)
    return Date.UTC(ano, mes - 1, dia)
  })
  return Math.round((b - a) / 86_400_000)
}

// "há 2 dias"; vazio quando é de hoje
export function tempoRelativo(iso: string): string {
  const dias = diasEntre(iso, HOJE)
  if (dias <= 0) return ''
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

// dias desde a abertura, para ordenar e destacar casos antigos
export function diasDesde(iso: string): number {
  return diasEntre(iso, HOJE)
}
