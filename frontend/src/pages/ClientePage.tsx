import { useParams } from 'react-router-dom'
import FichaCliente from '../components/FichaCliente/FichaCliente'
import PlanGate from '../components/PlanGate/PlanGate'
import './pages.css'

function ClientePage() {
  const { id = '' } = useParams()

  return (
    <div className="pagina">
      <PlanGate recurso="ficha_cliente">
        <FichaCliente clienteId={Number(id)} />
      </PlanGate>
    </div>
  )
}

export default ClientePage
