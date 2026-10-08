import type { CanalOrigem } from '../../types'
import { CANAIS } from '../../utils/canais'
import './CanalBadge.css'

function CanalBadge({ canal }: { canal: CanalOrigem }) {
  return <span className="canal-badge">{CANAIS[canal]}</span>
}

export default CanalBadge
