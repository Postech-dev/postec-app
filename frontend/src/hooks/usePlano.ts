import { useContext } from 'react'
import { PlanoContext } from '../components/PlanoProvider/planoContext'
import type { Recurso } from '../types'
import { PLANO_MINIMO, planoIncluiRecurso } from '../utils/planos'

// backend: ATENÇÃO, o plano no front é só visual (cadeado, aviso e botão "Conhecer planos").
// Quem de fato bloqueia é o backend: cada rota de recurso pago (pedidos/importacoes, integracoes, painel/ocorrencias,
// clientes, metricas) precisa de um middleware requirePlan(<plano mínimo>) que responde 403 e confere o plano
// da loja no servidor. Sem isso, qualquer pessoa chama a API direto e ignora o cadeado.
export function usePlano() {
  const { plano, trocarPlano, recarregar } = useContext(PlanoContext)

  return {
    plano,
    trocarPlano,
    recarregar,
    inclui: (recurso: Recurso) => planoIncluiRecurso(plano, recurso),
    planoMinimo: (recurso: Recurso) => PLANO_MINIMO[recurso],
  }
}
