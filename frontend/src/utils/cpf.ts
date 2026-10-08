// só dígitos
export function normalizarCpf(texto: string): string {
  return texto.replace(/\D/g, '')
}

function digito(base: string): number {
  const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * (base.length + 1 - i), 0)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

// confere tamanho, sequências repetidas e os dois dígitos verificadores
export function cpfValido(texto: string): boolean {
  const cpf = normalizarCpf(texto)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const d1 = digito(cpf.slice(0, 9))
  const d2 = digito(cpf.slice(0, 9) + d1)
  return cpf.endsWith(`${d1}${d2}`)
}

// 12345678909 -> ***.456.789-**
export function mascararCpf(texto: string): string {
  const cpf = normalizarCpf(texto)
  if (cpf.length !== 11) return '***.***.***-**'
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`
}
