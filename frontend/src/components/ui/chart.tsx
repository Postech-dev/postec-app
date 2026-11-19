import { createContext, useContext } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import './chart.css'

// Config no padrão shadcn/ui: cada série tem rótulo e cor,
// exposta como variável CSS --color-<chave> dentro do container
export type ChartConfig = Record<string, { label: string; color: string }>

const ChartContext = createContext<ChartConfig | null>(null)

function useChartConfig(): ChartConfig {
  const config = useContext(ChartContext)
  if (!config) throw new Error('useChartConfig deve ser usado dentro de <ChartContainer>')
  return config
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ComponentProps<typeof ResponsiveContainer>['children']
  // altura fixa do gráfico em px
  altura?: number
  rotuloAcessivel?: string
}

export function ChartContainer({ config, children, altura = 260, rotuloAcessivel }: ChartContainerProps) {
  const vars = Object.fromEntries(
    Object.entries(config).map(([chave, { color }]) => [`--color-${chave}`, color]),
  ) as CSSProperties

  return (
    <ChartContext.Provider value={config}>
      <div
        className="chart-container"
        style={{ ...vars, height: altura }}
        role="img"
        aria-label={rotuloAcessivel}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

// payload mínimo que o Recharts entrega ao content custom de Tooltip/Legend
interface ItemPayload {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
}

interface ChartTooltipContentProps {
  active?: boolean
  label?: ReactNode
  payload?: ItemPayload[]
}

// tooltip no estilo shadcn/ui: cartão com borda, swatch por série e valor alinhado à direita
export function ChartTooltipContent({ active, label, payload }: ChartTooltipContentProps) {
  const config = useChartConfig()
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip">
      {label != null && <span className="chart-tooltip-titulo">{label}</span>}
      <ul className="chart-tooltip-lista">
        {payload.map((item) => {
          const chave = String(item.dataKey ?? item.name ?? '')
          const serie = config[chave]
          return (
            <li key={chave} className="chart-tooltip-item">
              <span
                className="chart-swatch"
                style={{ background: serie?.color ?? item.color }}
                aria-hidden="true"
              />
              <span className="chart-tooltip-nome">{serie?.label ?? chave}</span>
              <span className="chart-tooltip-valor">{item.value}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// legenda estática a partir do config — identidade nunca depende só da cor do mark
export function ChartLegendContent() {
  const config = useChartConfig()
  return (
    <ul className="chart-legenda">
      {Object.entries(config).map(([chave, { label, color }]) => (
        <li key={chave} className="chart-legenda-item">
          <span className="chart-swatch" style={{ background: color }} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  )
}
