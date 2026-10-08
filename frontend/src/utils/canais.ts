import type { CanalOrigem } from '../types'

export const CANAIS: Record<CanalOrigem, string> = {
  portal: 'Portal do cliente',
  telefone: 'Telefone',
  instagram: 'Instagram',
  loja_fisica: 'Loja física',
  reclame_aqui: 'Reclame AQUI',
  email: 'E-mail',
  outro: 'Outro',
}

// canais que o lojista pode escolher ao abrir uma ocorrência (o portal é automático)
export const CANAIS_DA_LOJA: CanalOrigem[] = ['telefone', 'instagram', 'loja_fisica', 'reclame_aqui', 'email', 'outro']

export function canalPorRotulo(rotulo: string): CanalOrigem | undefined {
  return (Object.keys(CANAIS) as CanalOrigem[]).find((c) => CANAIS[c] === rotulo)
}
