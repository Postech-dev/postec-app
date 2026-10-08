import type { Plano, Recurso } from '../types'

export const ORDEM: Plano[] = ['starter', 'pro', 'business']

export const NOMES: Record<Plano, string> = { starter: 'Starter', pro: 'Pro', business: 'Business' }

// plano mínimo de cada recurso
export const PLANO_MINIMO: Record<Recurso, Plano> = {
  pedidos: 'starter',
  integracao: 'pro',
  crm: 'business',
  ficha_cliente: 'business',
  metricas: 'business',
}

export const DESCRICAO_PLANOS: Record<Plano, { resumo: string; itens: string[] }> = {
  starter: {
    resumo: 'Para começar a organizar o pós-venda.',
    itens: ['Fluxo de ocorrências e portal do cliente', 'Pedidos por planilha CSV', 'Cadastro manual de pedidos'],
  },
  pro: {
    resumo: 'Pedidos chegando sozinhos.',
    itens: ['Tudo do Starter', 'Integração automática com a plataforma da loja (Nuvemshop)'],
  },
  business: {
    resumo: 'Atendimento completo, com visão do cliente.',
    itens: ['Tudo do Pro', 'Abrir ocorrência pelo lojista (CRM)', 'Ficha do cliente', 'Métricas de atendimento'],
  },
}

export function planoIncluiRecurso(plano: Plano, recurso: Recurso): boolean {
  return ORDEM.indexOf(plano) >= ORDEM.indexOf(PLANO_MINIMO[recurso])
}
