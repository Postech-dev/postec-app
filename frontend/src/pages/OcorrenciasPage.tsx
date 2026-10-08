import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert/Alert'
import BotaoPlano from '../components/BotaoPlano/BotaoPlano'
import Button from '../components/Button/Button'
import CopyButton from '../components/CopyButton/CopyButton'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import Input from '../components/Input/Input'
import OcorrenciaTable from '../components/OcorrenciaTable/OcorrenciaTable'
import PageHeader from '../components/PageHeader/PageHeader'
import Select from '../components/Select/Select'
import StatCard from '../components/StatCard/StatCard'
import ViewToggle from '../components/ViewToggle/ViewToggle'
import { useDados } from '../hooks/useDados'
import { listarOcorrencias, resumoOcorrencias } from '../services/ocorrencias.service'
import { CANAIS, canalPorRotulo } from '../utils/canais'
import { ordenarPorPrioridade } from '../utils/ordenacao'
import { FLUXO } from '../utils/status'
import './pages.css'
import './OcorrenciasPage.css'

const POR_PAGINA = 10
const EM_ABERTO = 'Em aberto'
const OPCOES_STATUS = [EM_ABERTO, ...FLUXO]
const OPCOES_CANAL = Object.values(CANAIS)

function OcorrenciasPage() {
  // busca, status e página ficam na URL para sobreviver ao voltar do detalhe
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const canal = params.get('canal') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  const carregar = useCallback(async () => {
    const [itens, resumo] = await Promise.all([listarOcorrencias(), resumoOcorrencias()])
    return { itens: ordenarPorPrioridade(itens), resumo }
  }, [])
  const { dados, erro, tentarDeNovo } = useDados(carregar)

  function atualizar(mudancas: Record<string, string>) {
    const novos = new URLSearchParams(params)
    Object.entries(mudancas).forEach(([k, v]) => (v ? novos.set(k, v) : novos.delete(k)))
    if (!('pagina' in mudancas)) novos.delete('pagina')
    setParams(novos, { replace: true })
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (dados?.itens ?? []).filter((o) => {
      if (status === EM_ABERTO && o.status === 'Concluído') return false
      if (status && status !== EM_ABERTO && o.status !== status) return false
      if (canal && o.canal !== canalPorRotulo(canal)) return false
      if (!termo) return true
      return [o.protocolo, o.pedido.cliente.nome, o.pedido.numero].some((t) => t.toLowerCase().includes(termo))
    })
  }, [dados, busca, status, canal])

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!dados) return <p className="carregando">Carregando…</p>

  const { itens, resumo } = dados
  const novas = itens.filter((o) => o.status === 'Novo')
  const filtroAtivo = !!(busca || status || canal)
  const alternar = (valor: string) => atualizar({ status: status === valor ? '' : valor })

  return (
    <div className="pagina">
      <PageHeader
        eyebrow="PAINEL DO LOJISTA"
        titulo="Seu pós-venda, sob controle."
        subtitulo="Acompanhe os casos da sua loja e saiba o que precisa de atenção."
        acoes={
          <BotaoPlano recurso="crm" to="/ocorrencias/nova">
            + Nova ocorrência
          </BotaoPlano>
        }
      />

      <div className="cards-resumo">
        <StatCard
          titulo="Abertas"
          valor={resumo.abertas}
          descricao="Ocorrências em andamento"
          cor="brand"
          ativo={status === EM_ABERTO}
          onClick={() => alternar(EM_ABERTO)}
        />
        <StatCard
          titulo="Novas"
          valor={resumo.novas}
          descricao="Aguardando triagem"
          cor="blue"
          ativo={status === 'Novo'}
          onClick={() => alternar('Novo')}
        />
        <StatCard
          titulo="Aguardando devolução"
          valor={resumo.aguardandoDevolucao}
          descricao="Acompanhar com o cliente"
          ativo={status === 'Aguardando devolução'}
          onClick={() => alternar('Aguardando devolução')}
        />
        <StatCard
          titulo="Concluídas"
          valor={resumo.concluidas}
          descricao="Neste período"
          cor="green"
          ativo={status === 'Concluído'}
          onClick={() => alternar('Concluído')}
        />
      </div>

      {novas.length > 0 && (
        <Alert to={`/ocorrencias/${novas[0].protocolo}`}>
          {novas.length === 1 ? '1 nova ocorrência precisa' : `${novas.length} novas ocorrências precisam`} de
          triagem. Abra {novas[0].protocolo} para começar o atendimento.
        </Alert>
      )}

      <div className="ocorrencias-filtros">
        <ViewToggle />
        <div className="ocorrencias-busca">
          <Input
            label="Buscar"
            type="search"
            placeholder="Protocolo, cliente ou pedido"
            value={busca}
            onChange={(e) => atualizar({ q: e.target.value })}
          />
        </div>
        <div className="ocorrencias-status">
          <Select
            label="Status"
            opcoes={OPCOES_STATUS}
            placeholder="Todos os status"
            value={status}
            onChange={(e) => atualizar({ status: e.target.value })}
          />
        </div>
        <div className="ocorrencias-status">
          <Select
            label="Canal"
            opcoes={OPCOES_CANAL}
            placeholder="Todos os canais"
            value={canal}
            onChange={(e) => atualizar({ canal: e.target.value })}
          />
        </div>
      </div>

      {itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma ocorrência ainda"
          texto="Compartilhe o link do portal com seus clientes. As solicitações aparecem aqui assim que forem abertas."
        >
          <CopyButton texto={`${window.location.origin}/portal/mariana-modas`} rotulo="Copiar link do portal" />
        </EstadoVazio>
      ) : filtrados.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma ocorrência encontrada"
          texto="Nenhum caso combina com a busca ou o filtro. Tente outro termo ou limpe os filtros."
        >
          {filtroAtivo && (
            <Button variante="secundario" onClick={() => setParams({}, { replace: true })}>
              Limpar filtros
            </Button>
          )}
        </EstadoVazio>
      ) : (
        <OcorrenciaTable
          itens={filtrados}
          pagina={pagina}
          porPagina={POR_PAGINA}
          onPagina={(p) => atualizar({ pagina: p > 1 ? String(p) : '' })}
        />
      )}
    </div>
  )
}

export default OcorrenciasPage
