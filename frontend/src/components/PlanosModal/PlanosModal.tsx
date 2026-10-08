import { usePlano } from '../../hooks/usePlano'
import { DESCRICAO_PLANOS, NOMES, ORDEM } from '../../utils/planos'
import Button from '../Button/Button'
import Modal from '../Modal/Modal'
import './PlanosModal.css'

interface PlanosModalProps {
  aberto: boolean
  onFechar: () => void
}

function PlanosModal({ aberto, onFechar }: PlanosModalProps) {
  const { plano: atual } = usePlano()

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      larga
      eyebrow="Planos"
      titulo="Escolha o plano da sua loja"
      acoes={<Button onClick={onFechar}>Fechar</Button>}
    >
      <p className="planos-nota">Por enquanto só apresentamos os planos. Não há cobrança nesta versão.</p>
      <div className="planos-lista">
        {ORDEM.map((p) => (
          <section key={p} className={`plano-card ${p === atual ? 'plano-atual' : ''}`}>
            <h3>{NOMES[p]}</h3>
            {p === atual && <span className="plano-etiqueta">Seu plano</span>}
            <p className="plano-resumo">{DESCRICAO_PLANOS[p].resumo}</p>
            <ul>
              {DESCRICAO_PLANOS[p].itens.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}

export default PlanosModal
