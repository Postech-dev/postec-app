import type { Loja, Usuario } from '../types'

export const lojasMock: Loja[] = [
  {
    id: 1,
    nome: 'Mariana Modas',
    slug: 'mariana-modas',
    plano: 'business',
    email: 'atendimento@marianamodas.com.br',
    ativa: true,
    prazoRespostaDias: 2,
    enderecoDevolucao: 'Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000',
  },
  {
    id: 2,
    nome: 'Ateliê Mariana',
    slug: 'atelie-mariana',
    plano: 'starter',
    email: 'contato@ateliemariana.com.br',
    ativa: true,
    prazoRespostaDias: 3,
    enderecoDevolucao: 'Ateliê Mariana - Av. Paulista, 900, sala 12, São Paulo/SP, CEP 01310-100',
  },
]

export const equipeMock: Usuario[] = [
  {
    id: 1,
    nome: 'Mariana Silva',
    email: 'mariana@marianamodas.com.br',
    papel: 'Administradora',
    lojaNome: 'Mariana Modas',
  },
  {
    id: 2,
    nome: 'Paula Rocha',
    email: 'paula@marianamodas.com.br',
    papel: 'Atendente',
    lojaNome: 'Mariana Modas',
  },
]
