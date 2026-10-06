export interface Usuario {
  id: number;
  loja_id: number;
  nome: string;
  email: string;
  senha?: string;
  role: 'admin' | 'atendente';
}

export interface Loja {
  id: number;
  nome: string;
  slug: string;
  email: string;
  plano: string;
}

export type lojas = Loja;

export interface Pedido {
  id: number;
  loja_id: number;
  numero_pedido: string;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_email: string;
  produto: string;
  valor: number;
  data_compra: string;
}

export interface Ocorrencia {
  id: number;
  loja_id: number;
  pedido_id: number;
  protocolo: string;
  status: 'Novo' | 'Em Triagem' | 'Aguardando Devolução' | 'Reenvio Solicitado' | 'Estorno Solicitado' | 'Concluído';
  motivo: string;
  descricao: string;
  tipo_resolucao?: 'Reenvio' | 'Estorno';
  codigo_rastreio?: string;
  valor_estorno?: number;
  comprovante_estorno?: string;
  criado_em: string;
}

export interface Mensagem {
  id: number;
  ocorrencia_id: number;
  autor: 'cliente' | 'atendente' | 'sistema';
  texto: string;
  enviado_em: string;
}
