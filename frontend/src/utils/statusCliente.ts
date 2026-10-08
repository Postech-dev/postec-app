import type { StatusOcorrencia } from '../types'

interface InfoStatusCliente {
  // como o status aparece para o cliente
  rotulo: string
  // o que acontece agora, em uma ou duas frases
  agora: string
  // posição na linha do tempo (0 a 4)
  etapa: number
  // depende de uma ação do cliente
  acaoNecessaria: boolean
}

// única fonte de texto de status para o portal; o painel da loja usa os nomes internos
export const STATUS_CLIENTE: Record<StatusOcorrencia, InfoStatusCliente> = {
  Novo: {
    rotulo: 'Recebemos sua solicitação',
    agora: 'A loja já recebeu seu pedido de ajuda e vai começar a analisar em breve.',
    etapa: 0,
    acaoNecessaria: false,
  },
  'Em triagem': {
    rotulo: 'A loja está analisando',
    agora: 'A loja está conferindo o que aconteceu. Se precisar de algo, ela escreve para você aqui.',
    etapa: 1,
    acaoNecessaria: false,
  },
  'Aguardando devolução': {
    rotulo: 'Aguardando você devolver o produto',
    agora: 'Devolva o produto seguindo as orientações abaixo. Quando a loja receber, o atendimento continua.',
    etapa: 2,
    acaoNecessaria: true,
  },
  'Reenvio solicitado': {
    rotulo: 'Preparando o novo envio',
    agora: 'A loja está preparando o novo envio. Você recebe o código de rastreio assim que ele for postado.',
    etapa: 3,
    acaoNecessaria: false,
  },
  'Estorno solicitado': {
    rotulo: 'Preparando seu reembolso',
    agora: 'A loja está processando o reembolso. Você recebe a confirmação por e-mail quando terminar.',
    etapa: 3,
    acaoNecessaria: false,
  },
  Concluído: {
    rotulo: 'Resolvido',
    agora: 'Seu caso foi resolvido. Veja abaixo como ficou.',
    etapa: 4,
    acaoNecessaria: false,
  },
}

// passos da linha do tempo, na ordem
export const ETAPAS_CLIENTE = [
  'Solicitação recebida',
  'Em análise',
  'Devolução (se necessária)',
  'Reenvio ou reembolso',
  'Resolvido',
]

export function textoPrazo(dias: number): string {
  return `A loja costuma responder em até ${dias} ${dias === 1 ? 'dia útil' : 'dias úteis'}.`
}
