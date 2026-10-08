// simula latência da rede enquanto os serviços usam mocks
export function atraso<T>(valor: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms))
}
