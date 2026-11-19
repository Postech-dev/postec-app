import { useCallback, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import type { ItemSemana } from '../../types'
import { useDados } from '../../hooks/useDados'
import { obterMetricas } from '../../services/metricas.service'
import { formatarMoeda } from '../../utils/format'
import { FLUXO } from '../../utils/status'
import Card from '../Card/Card'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import GraficoBarras from '../GraficoBarras/GraficoBarras'
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '../ui/chart'
import type { ChartConfig } from '../ui/chart'
import StatCard from '../StatCard/StatCard'
import StatusBadge from '../StatusBadge/StatusBadge'
import './PainelMetricas.css'

const PERIODOS = [
  { label: '7 dias', valor: 7 },
  { label: '30 dias', valor: 30 },
  { label: '90 dias', valor: 90 },
]

// "4h 3min" ou "25 min"
function formatarDuracao(minutos: number | null): string {
  if (minutos === null) return '—'
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)}h ${minutos % 60}min`
}

// skeleton de card para estado de carregamento
function SkeletonCard() {
  return <div className="metricas-skeleton" aria-hidden="true" />
}

// gráfico de barras agrupadas abertas x concluídas por semana (Recharts, padrão shadcn/ui)
const configSemanal: ChartConfig = {
  abertas: { label: 'Abertas', color: 'var(--action)' },
  concluidas: { label: 'Concluídas', color: 'var(--green)' },
}

function GraficoSemanal({ dados }: { dados: ItemSemana[] }) {
  return (
    <Card titulo="Abertas × concluídas por semana">
      {dados.every((s) => s.abertas === 0 && s.concluidas === 0) ? (
        <p className="grafico-vazio">Ainda não há dados para mostrar.</p>
      ) : (
        <ChartContainer
          config={configSemanal}
          altura={260}
          rotuloAcessivel="Gráfico de barras abertas versus concluídas por semana"
        >
          <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'var(--bg)' }} content={<ChartTooltipContent />} />
            <Bar dataKey="abertas" fill="var(--color-abertas)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="concluidas" fill="var(--color-concluidas)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Legend verticalAlign="top" align="left" content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  )
}

function PainelMetricas() {
  const [periodo, setPeriodo] = useState(30)

  const carregar = useCallback(() => obterMetricas(periodo), [periodo])
  const { dados, erro, tentarDeNovo, carregando } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />

  const semVazio = !carregando && dados &&
    dados.porMotivo.length === 0 && dados.porCanal.length === 0

  return (
    <>
      {/* seletor de período */}
      <div className="metricas-periodo" role="group" aria-label="Selecionar período">
        {PERIODOS.map((p) => (
          <button
            key={p.valor}
            type="button"
            className={`metricas-periodo-btn ${periodo === p.valor ? 'metricas-periodo-ativo' : ''}`}
            onClick={() => setPeriodo(p.valor)}
            aria-pressed={periodo === p.valor}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs — grid 5 colunas desktop */}
      <div className="metricas-kpis">
        {carregando ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              titulo="Abertas"
              valor={dados?.abertas ?? 0}
              descricao="Tudo que não está Concluído"
              cor="brand"
            />
            <StatCard
              titulo="1ª resposta"
              valor={formatarDuracao(dados?.tempoMedioPrimeiraResposta ?? null)}
              descricao="Média entre abertura e 1ª mensagem do atendente"
              cor="blue"
            />
            <StatCard
              titulo="Taxa de resolução"
              valor={`${dados?.taxaResolucao ?? 0}%`}
              descricao={`Concluídas / total nos últimos ${periodo} dias`}
              cor="green"
            />
            <StatCard
              titulo="Reenvios"
              valor={dados?.reenviosPeriodo ?? 0}
              descricao={`Nos últimos ${periodo} dias`}
            />
            <StatCard
              titulo="Estornos"
              valor={dados?.estornosPeriodo ?? 0}
              descricao={dados?.valorEstornosPeriodo ? formatarMoeda(dados.valorEstornosPeriodo) : `Nos últimos ${periodo} dias`}
              cor="ink"
            />
          </>
        )}
      </div>

      {semVazio && (
        <p className="metricas-sem-dados">
          Nenhuma ocorrência neste período. Tente um intervalo maior.
        </p>
      )}

      {/* gráficos 2 por linha */}
      {!carregando && dados && (
        <>
          <div className="metricas-graficos">
            <GraficoBarras titulo="Por motivo" itens={dados.porMotivo} />
            <GraficoBarras titulo="Por canal de origem" itens={dados.porCanal} cor="var(--ink-soft)" />
          </div>

          {/* por etapa na ordem do fluxo */}
          <Card titulo="Ocorrências por etapa">
            <ul className="metricas-etapas">
              {FLUXO.map((status) => {
                const item = dados.porStatus.find((s) => s.rotulo === status)
                const qtd = item?.valor ?? 0
                const total = dados.porStatus.reduce((s, i) => s + i.valor, 0)
                const pct = total > 0 ? Math.round((qtd / total) * 100) : 0
                return (
                  <li key={status} className="metricas-etapa">
                    <StatusBadge status={status} />
                    <div className="metricas-etapa-barra-wrap">
                      <div className="grafico-trilho">
                        <div className="grafico-barra" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="metricas-etapa-num">{qtd}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <GraficoSemanal dados={dados.porSemana} />
        </>
      )}
    </>
  )
}

export default PainelMetricas
