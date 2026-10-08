import type { ItemGrafico } from '../../types'
import Card from '../Card/Card'
import './GraficoBarras.css'

interface GraficoBarrasProps {
  titulo: string
  itens: ItemGrafico[]
}

// barras horizontais em CSS; o número fica escrito, então não depende só da cor
function GraficoBarras({ titulo, itens }: GraficoBarrasProps) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor))
  const total = itens.reduce((soma, i) => soma + i.valor, 0)

  return (
    <Card titulo={titulo}>
      {itens.length === 0 ? (
        <p className="grafico-vazio">Ainda não há dados para mostrar.</p>
      ) : (
        <ul className="grafico">
          {itens.map((i) => (
            <li key={i.rotulo}>
              <div className="grafico-linha">
                <span>{i.rotulo}</span>
                <strong>
                  {i.valor} <span className="grafico-pct">({Math.round((i.valor / total) * 100)}%)</span>
                </strong>
              </div>
              <div className="grafico-trilho" aria-hidden="true">
                <div className="grafico-barra" style={{ width: `${(i.valor / maximo) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default GraficoBarras
