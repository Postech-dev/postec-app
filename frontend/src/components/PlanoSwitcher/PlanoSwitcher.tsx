import { usePlano } from '../../hooks/usePlano'
import type { Plano } from '../../types'
import { modoDemo } from '../../utils/demo'
import { NOMES, ORDEM } from '../../utils/planos'
import './PlanoSwitcher.css'

// só aparece no modo demonstração (VITE_DEMO=true ou ?demo=1), para trocar o plano ao vivo
function PlanoSwitcher() {
  const { plano, trocarPlano } = usePlano()

  if (!modoDemo()) return null

  return (
    <label className="plano-switcher">
      <span>Plano (demonstração)</span>
      <select value={plano} onChange={(e) => trocarPlano(e.target.value as Plano)}>
        {ORDEM.map((p) => (
          <option key={p} value={p}>
            {NOMES[p]}
          </option>
        ))}
      </select>
    </label>
  )
}

export default PlanoSwitcher
