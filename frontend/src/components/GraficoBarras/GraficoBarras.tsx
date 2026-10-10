import type { ItemGrafico } from '../../types'
import Card from '../Card/Card'
import './GraficoBarras.css'

interface GraficoBarrasProps {
  titulo: string
  itens: ItemGrafico[]
  // cor da barra; padrão: laranja
  cor?: string
}

// barras proporcionais ao total (não ao máximo), ordenadas do maior para o menor
function GraficoBarras({ titulo, itens, cor }: GraficoBarrasProps) {
  const total = itens.reduce((soma, i) => soma + i.valor, 0)
  const ordenados = [...itens].sort((a, b) => b.valor - a.valor)

  return (
    <Card titulo={titulo}>
      {ordenados.length === 0 ? (
        <p className="grafico-vazio">Ainda não há dados para mostrar.</p>
      ) : (
        <ul className="grafico">
          {ordenados.map((i) => {
            const pct = total > 0 ? Math.round((i.valor / total) * 100) : 0
            return (
              <li key={i.rotulo}>
                <div className="grafico-linha">
                  <span className="grafico-rotulo">{i.rotulo}</span>
                  <strong className="grafico-num">
                    {i.valor} <span className="grafico-pct">· {pct}%</span>
                  </strong>
                </div>
                <div
                  className="grafico-trilho"
                  aria-label={`${pct}%`}
                  role="meter"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="grafico-barra"
                    style={{ width: `${pct}%`, ...(cor ? { background: cor } : {}) }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default GraficoBarras
