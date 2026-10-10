import { useCallback } from 'react'
import CopyButton from '../components/CopyButton/CopyButton'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import KanbanBoard from '../components/KanbanBoard/KanbanBoard'
import PageHeader from '../components/PageHeader/PageHeader'
import ViewToggle from '../components/ViewToggle/ViewToggle'
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
        titulo="Seu pós-venda, sob controle."
        acoes={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ViewToggle />
            <span>{pluralOcorrencias(itens.length)}</span>
          </div>
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
