import type { Loja } from '../../types'
import { NOMES } from '../../utils/planos'
import Button from '../Button/Button'
import Card from '../Card/Card'
import './LojaCard.css'

interface LojaCardProps {
  loja: Loja
  onExcluir: () => void
}

function LojaCard({ loja, onExcluir }: LojaCardProps) {
  return (
    <Card>
      <div>
        <span className="loja-ativa">{loja.ativa ? 'Ativa' : 'Inativa'}</span>
      </div>
      <div>
        <h2 className="loja-nome">{loja.nome}</h2>
        <span className="loja-plano">Plano {NOMES[loja.plano]}</span>
      </div>
      <div className="loja-portal">
        <span>Portal do cliente</span>
        <strong>postec.app/portal/{loja.slug}</strong>
      </div>
      <div className="loja-acoes">
        <Button to={`/lojas/${loja.id}/editar`} variante="secundario">
          Editar
        </Button>
        <Button to={`/portal/${loja.slug}`} variante="secundario">
          Abrir portal
        </Button>
        <Button variante="fantasma" onClick={onExcluir}>
          Excluir
        </Button>
      </div>
    </Card>
  )
}

export default LojaCard
