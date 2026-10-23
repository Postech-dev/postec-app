import { useCallback, useState } from 'react'
import type { ItemSemana } from '../../types'
import { useDados } from '../../hooks/useDados'
import { obterMetricas } from '../../services/metricas.service'
import { formatarMoeda } from '../../utils/format'
import { FLUXO } from '../../utils/status'
import Card from '../Card/Card'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import GraficoBarras from '../GraficoBarras/GraficoBarras'
import StatCard from '../StatCard/StatCard'
import StatusBadge from '../StatusBadge/StatusBadge'
import './PainelMetricas.css'

const PERIODOS = [
  { label: '7 dias', valor: 7 },
  { label: '30 dias', valor: 30 },
  { label: '90 dias', valor: 90 },
]

function formatarDuracao(minutos: number | null): string {
  if (minutos === null) return '—'
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)}h ${minutos % 60}min`
}

function SkeletonCard() {
  return <div className="metricas-skeleton" aria-hidden="true" />
}

function GraficoSemanal({ dados }: { dados: ItemSemana[] }) {
  const alturaGrafico = 120
  const labelHeight = 28
  const svgHeight = alturaGrafico + labelHeight
  const larguraBarra = 18
  const gap = 6
  const grupoPasso = larguraBarra * 2 + gap + 16
  const paddingLeft = 32
  const larguraTotal = dados.length * grupoPasso + paddingLeft + 16
  const maximo = Math.max(1, ...dados.flatMap((s) => [s.abertas, s.concluidas]))

  // linhas de grade em 25%, 50%, 75%, 100%
  const grades = [0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maximo))

  function altBarra(v: number) {
    return Math.max(3, (v / maximo) * alturaGrafico)
  }

  const semDados = dados.every((s) => s.abertas === 0 && s.concluidas === 0)

  return (
    <Card titulo="Abertas × concluídas por semana">
      {semDados ? (
        <p className="grafico-vazio">Ainda não há dados para mostrar.</p>
      ) : (
        <>
          <div className="grafico-semanal-legenda">
            <span className="grafico-semanal-leg grafico-semanal-leg-abertas">Abertas</span>
            <span className="grafico-semanal-leg grafico-semanal-leg-concluidas">Concluídas</span>
          </div>
          <div className="grafico-semanal-wrap">
            <svg
              className="grafico-semanal-svg"
              viewBox={`0 0 ${larguraTotal} ${svgHeight}`}
              aria-label="Gráfico de barras abertas versus concluídas por semana"
              role="img"
            >
              {/* linhas de grade */}
              {grades.map((v) => {
                const y = alturaGrafico - (v / maximo) * alturaGrafico
                return (
                  <g key={v}>
                    <line
                      x1={paddingLeft}
                      x2={larguraTotal - 8}
                      y1={y}
                      y2={y}
                      stroke="var(--line)"
                      strokeWidth={1}
                    />
                    <text
                      x={paddingLeft - 4}
                      y={y + 4}
                      textAnchor="end"
                      fontSize={9}
                      fill="var(--ink-soft)"
                    >
                      {v}
                    </text>
                  </g>
                )
              })}

              {/* barras */}
              {dados.map((s, i) => {
                const x = paddingLeft + i * grupoPasso
                const hA = altBarra(s.abertas)
                const hC = altBarra(s.concluidas)
                const yA = alturaGrafico - hA
                const yC = alturaGrafico - hC
                return (
                  <g key={s.rotulo}>
                    {/* barra abertas */}
                    <rect
                      x={x}
                      y={yA}
                      width={larguraBarra}
                      height={hA}
                      rx={4}
                      fill="var(--action)"
                    />
                    {s.abertas > 0 && (
                      <text
                        x={x + larguraBarra / 2}
                        y={yA - 4}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight="700"
                        fill="var(--action)"
                      >
                        {s.abertas}
                      </text>
                    )}

                    {/* barra concluídas */}
                    <rect
                      x={x + larguraBarra + gap}
                      y={yC}
                      width={larguraBarra}
                      height={hC}
                      rx={4}
                      fill="var(--green)"
                    />
                    {s.concluidas > 0 && (
                      <text
                        x={x + larguraBarra + gap + larguraBarra / 2}
                        y={yC - 4}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight="700"
                        fill="var(--green)"
                      >
                        {s.concluidas}
                      </text>
                    )}

                    {/* rótulo semana */}
                    <text
                      x={x + larguraBarra + gap / 2}
                      y={alturaGrafico + 18}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--ink-soft)"
                    >
                      {s.rotulo}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </>
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

      <div className="metricas-kpis">
        {carregando ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              titulo="Em aberto"
              valor={dados?.abertas ?? 0}
              descricao="Ocorrências não concluídas agora"
              cor="brand"
            />
            <StatCard
              titulo="1ª resposta"
              valor={formatarDuracao(dados?.tempoMedioPrimeiraResposta ?? null)}
              descricao="Tempo médio até o atendente responder"
              cor="blue"
            />
            <StatCard
              titulo="Taxa de resolução"
              valor={`${dados?.taxaResolucao ?? 0}%`}
              descricao={`Concluídas / abertas nos últimos ${periodo} dias`}
              cor="green"
            />
            <StatCard
              titulo="Reenvios"
              valor={dados?.reenviosPeriodo ?? 0}
              descricao={`Últimos ${periodo} dias`}
            />
            <StatCard
              titulo="Estornos"
              valor={dados?.estornosPeriodo ?? 0}
              descricao={dados?.valorEstornosPeriodo ? `Total: ${formatarMoeda(dados.valorEstornosPeriodo)}` : `Últimos ${periodo} dias`}
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

      {!carregando && dados && (
        <>
          <div className="metricas-graficos">
            <GraficoBarras titulo="Por motivo" itens={dados.porMotivo} />
            <GraficoBarras titulo="Por canal de origem" itens={dados.porCanal} cor="var(--blue)" />
          </div>

          <Card titulo="Distribuição por etapa do fluxo">
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
