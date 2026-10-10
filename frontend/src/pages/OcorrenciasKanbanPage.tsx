import { useCallback } from 'react'
import BackLink from '../components/BackLink/BackLink'
import CopyButton from '../components/CopyButton/CopyButton'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import KanbanBoard from '../components/KanbanBoard/KanbanBoard'
import PageHeader from '../components/PageHeader/PageHeader'
import { useDados } from '../hooks/useDados'
import { listarOcorrencias } from '../services/ocorrencias.service'
import { pluralOcorrencias } from '../utils/format'
import { ordenarPorPrioridade } from '../utils/ordenacao'
import './pages.css'

function OcorrenciasKanbanPage() {
  const carregar = useCallback(async () => ordenarPorPrioridade(await listarOcorrencias()), [])
  const { dados: itens, erro, tentarDeNovo } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!itens) return <p className="carregando">Carregando…</p>

  return (
    <div className="pagina pagina-kanban">
      <PageHeader
        eyebrow="OCORRÊNCIAS"
        titulo="Uma visão de cada etapa."
        subtitulo="Clique em um cartão para mais informações, as mudanças de etapa seguem o fluxo de resolução."
        acoes={
          <>
            <BackLink to="/ocorrencias">Tabela</BackLink> <span>{pluralOcorrencias(itens.length)}</span>
          </>
        }
      />
      {itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma ocorrência ainda"
          texto="Compartilhe o link do portal com seus clientes. As solicitações aparecem aqui assim que forem abertas."
        >
          <CopyButton texto={`${window.location.origin}/portal/mariana-modas`} rotulo="Copiar link do portal" />
        </EstadoVazio>
      ) : (
        <KanbanBoard itens={itens} />
      )}
    </div>
  )
}

export default OcorrenciasKanbanPage
