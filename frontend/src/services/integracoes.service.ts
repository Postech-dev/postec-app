import type { StatusIntegracao } from '../types'
import { api } from './api'

const CAMINHO = '/integracoes/nuvemshop'

export function statusNuvemshop(): Promise<StatusIntegracao> {
  return api.get(CAMINHO)
}

export async function conectarNuvemshop(): Promise<void> {
  const { url } = await api.post<{ url: string }>(`${CAMINHO}/conectar`)
  window.location.assign(url)
}

export async function desconectarNuvemshop(): Promise<void> {
  await api.delete(CAMINHO)
}

export async function sincronizarNuvemshop(): Promise<void> {
  await api.post(`${CAMINHO}/sincronizar`)
}
