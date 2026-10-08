import { limparSessao, tokenAtual } from './sessao'

// em desenvolvimento o Vite repassa /api para o backend (veja vite.config.ts)
const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ErroApi extends Error {
  status: number

  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.status = status
  }
}

interface Opcoes {
  corpo?: unknown
  // rotas do portal e o login não levam o token
  publico?: boolean
}

async function chamar<T>(metodo: string, caminho: string, { corpo, publico }: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {}
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  const token = tokenAtual()
  if (token && !publico) cabecalhos.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi('Não conseguimos falar com o servidor. Verifique a conexão e tente de novo.', 0)
  }

  if (resposta.status === 204) return undefined as T

  let dados: unknown = null
  try {
    dados = await resposta.json()
  } catch {
    // resposta sem corpo JSON
  }

  if (!resposta.ok) {
    // sessão vencida: volta para o login
    if (resposta.status === 401 && !publico && token) {
      limparSessao()
      window.location.assign('/login')
    }
    const mensagem = (dados as { mensagem?: string } | null)?.mensagem
    throw new ErroApi(mensagem ?? 'Algo deu errado. Tente de novo em instantes.', resposta.status)
  }

  return dados as T
}

export const api = {
  get: <T>(caminho: string, opcoes?: Opcoes) => chamar<T>('GET', caminho, opcoes),
  post: <T>(caminho: string, corpo?: unknown, opcoes?: Opcoes) => chamar<T>('POST', caminho, { ...opcoes, corpo }),
  patch: <T>(caminho: string, corpo?: unknown, opcoes?: Opcoes) => chamar<T>('PATCH', caminho, { ...opcoes, corpo }),
  put: <T>(caminho: string, corpo?: unknown, opcoes?: Opcoes) => chamar<T>('PUT', caminho, { ...opcoes, corpo }),
}
