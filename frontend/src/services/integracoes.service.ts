import type { StatusIntegracao } from '../types'
import { HOJE } from '../utils/format'
import { atraso } from './atraso'

let nuvemshop: StatusIntegracao = { conectada: false }

// backend: GET /integracoes/nuvemshop (só plano Pro ou Business; 403 no Starter via requirePlan)
export async function statusNuvemshop(): Promise<StatusIntegracao> {
  return atraso({ ...nuvemshop })
}

// backend: iniciar o OAuth da Nuvemshop (redirecionar o lojista para a autorização e receber o callback),
// guardar o token da loja e começar a importar os pedidos automaticamente (webhooks da Nuvemshop)
// aqui só simula a conexão
export async function conectarNuvemshop(): Promise<StatusIntegracao> {
  nuvemshop = { conectada: true, conectadaEm: HOJE }
  return atraso({ ...nuvemshop })
}

// backend: revogar o token e parar de receber os webhooks
export async function desconectarNuvemshop(): Promise<StatusIntegracao> {
  nuvemshop = { conectada: false }
  return atraso({ ...nuvemshop })
}
