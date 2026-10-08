// padrão dos Correios: 2 letras, 9 números e BR (ex.: AA987654321BR)
const PADRAO = /^[A-Z]{2}\d{9}BR$/

export function normalizarRastreio(texto: string): string {
  return texto.replace(/\s/g, '').toUpperCase()
}

export function rastreioValido(codigo: string): boolean {
  return PADRAO.test(codigo)
}

export function linkCorreios(codigo: string): string {
  return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(codigo)}`
}
