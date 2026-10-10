export type StatusOcorrencia =
  | 'Novo'
  | 'Em triagem'
  | 'Aguardando devolução'
  | 'Reenvio solicitado'
  | 'Estorno solicitado'
  | 'Concluído'

export type Plano = 'starter' | 'pro' | 'business'

// recursos que dependem do plano
export type Recurso = 'pedidos' | 'integracao' | 'crm' | 'ficha_cliente' | 'metricas'

export type CanalOrigem = 'portal' | 'telefone' | 'instagram' | 'loja_fisica' | 'reclame_aqui' | 'email' | 'outro'

export interface Cliente {
  id: number
  nome: string
  email: string
  // só dígitos
  cpf: string
}

export interface Pedido {
  id: number
  numero: string
  cliente: Cliente
  produto: string
  tamanho?: string
  quantidade: number
  // texto pronto para exibir, ex.: "Tamanho M • 1 unidade"
  detalhe: string
  valor: number
  // AAAA-MM-DD
  dataPedido: string
}

export interface Resolucao {
  tipo: 'Reenvio' | 'Estorno'
  codigoRastreio?: string
  itens?: string
  valor?: number
  transacao?: string
  comprovante?: string
  concluidoEm: string
}

export interface Ocorrencia {
  id: number
  protocolo: string
  status: StatusOcorrencia
  motivo: string
  descricao: string
  pedido: Pedido
  abertaEm: string
  // quem assumiu o atendimento (vazio enquanto ninguém assumiu)
  responsavel?: string
  canal: CanalOrigem
  // código longo do link enviado por e-mail (/portal/:slug/caso/:token)
  token: string
  tokenExpiraEm: string
  resolucao?: Resolucao
  // orientações enviadas ao cliente quando a loja pede a devolução
  orientacaoDevolucao?: string
  // mensagem do cliente ainda não vista pela loja
  naoLida?: boolean
  // calculado na listagem: o último contato foi do cliente
  aguardandoLoja?: boolean
  // calculado na listagem: data da última mensagem ou evento
  ultimaAtividade?: string
}

export interface Mensagem {
  id: number
  autor: 'cliente' | 'loja' | 'sistema'
  nome: string
  texto: string
  // data e hora no formato 2026-10-06T10:30
  data: string
  anexo?: string
  // nota interna: só a equipe da loja vê
  interna?: boolean
}

export interface Loja {
  id: number
  nome: string
  slug: string
  plano: Plano
  email: string
  ativa: boolean
  // prazo que a loja promete para responder, em dias úteis (aparece no portal)
  prazoRespostaDias: number
  // endereço para o cliente devolver produtos
  enderecoDevolucao: string
}

export interface Usuario {
  id: number
  nome: string
  email: string
  papel: 'Administradora' | 'Atendente'
  lojaNome: string
  // vêm do login real; o mock da equipe não tem
  lojaId?: number
  lojaSlug?: string
  lojaPlano?: Plano
}

export interface ContagensPainel {
  novas: number
  naoLidas: number
}

export interface ResumoOcorrencias {
  abertas: number
  novas: number
  aguardandoDevolucao: number
  concluidas: number
  total: number
}

// contexto repassado pelo PortalShell às telas do portal
export interface PortalContexto {
  loja: Loja
}

// dados de um pedido vindos do cadastro manual ou do CSV
export interface DadosPedido {
  numero: string
  clienteNome: string
  clienteEmail: string
  // só dígitos
  clienteCpf: string
  produto: string
  tamanho?: string
  quantidade: number
  valor: number
  // AAAA-MM-DD
  dataPedido: string
}

export interface PedidoListado extends Pedido {
  totalOcorrencias: number
}

// linha do CSV que passou na validação
export interface LinhaPrevia extends DadosPedido {
  linha: number
  situacao: 'novo' | 'atualizar'
}

export interface ErroLinha {
  // número da linha no arquivo (1 = cabeçalho); 0 = erro do arquivo todo
  linha: number
  mensagem: string
}

export interface ResultadoImportacao {
  novos: number
  atualizados: number
  erros: ErroLinha[]
  linhas: LinhaPrevia[]
}

export interface FichaCliente {
  cliente: Cliente
  pedidos: Pedido[]
  ocorrencias: Ocorrencia[]
  totalPedidos: number
  totalOcorrencias: number
  ultimaInteracao: string
}

export interface ItemGrafico {
  rotulo: string
  valor: number
}

export interface ItemSemana {
  rotulo: string
  abertas: number
  concluidas: number
}

export interface Metricas {
  abertas: number
  // minutos; null até o backend expor primeira_resposta_em
  tempoMedioPrimeiraResposta: number | null
  // 0 a 100
  taxaResolucao: number
  porMotivo: ItemGrafico[]
  porCanal: ItemGrafico[]
  reenviosPeriodo: number
  estornosPeriodo: number
  valorEstornosPeriodo: number
  porStatus: ItemGrafico[]
  porSemana: ItemSemana[]
}

export interface StatusIntegracao {
  conectada: boolean
  conectadaEm?: string
}
