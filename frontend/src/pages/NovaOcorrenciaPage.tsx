import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import BackLink from '../components/BackLink/BackLink'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import NovaOcorrenciaForm from '../components/NovaOcorrenciaForm/NovaOcorrenciaForm'
import PageHeader from '../components/PageHeader/PageHeader'
import PlanGate from '../components/PlanGate/PlanGate'
import { useDados } from '../hooks/useDados'
import { buscarPedido } from '../services/pedidos.service'
import './pages.css'

// "Abrir contato" chega com ?pedido=ID e já traz o pedido selecionado
function NovaOcorrenciaPage() {
  const [params] = useSearchParams()
  const pedidoId = params.get('pedido')
  const carregar = useCallback(
    async () => ({ pedido: pedidoId ? await buscarPedido(Number(pedidoId)) : null }),
    [pedidoId],
  )
  const { dados, erro, tentarDeNovo } = useDados(carregar)

  return (
    <div className="pagina">
      <BackLink to="/ocorrencias">Ocorrências</BackLink>
      <PageHeader
        eyebrow="OCORRÊNCIAS"
        titulo="Nova ocorrência"
        subtitulo="Registre um contato que chegou por fora do portal e já responda ao cliente."
      />
      <PlanGate recurso="crm">
        {erro ? (
          <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
        ) : dados ? (
          <NovaOcorrenciaForm pedidoInicial={dados.pedido} />
        ) : (
          <p className="carregando">Carregando…</p>
        )}
      </PlanGate>
    </div>
  )
}

export default NovaOcorrenciaPage
