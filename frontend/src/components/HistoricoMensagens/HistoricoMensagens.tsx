import type { Mensagem } from '../../types'
import { diaDe, formatarSeparadorDia } from '../../utils/format'
import MensagemItem from '../MensagemItem/MensagemItem'
import './HistoricoMensagens.css'

interface HistoricoMensagensProps {
  mensagens: Mensagem[]
  perspectiva: 'loja' | 'cliente'
}

function HistoricoMensagens({ mensagens, perspectiva }: HistoricoMensagensProps) {
  if (mensagens.length === 0) {
    return <p className="historico-vazio">Nenhuma mensagem ainda.</p>
  }

  return (
    <div className="historico">
      {mensagens.map((m, i) => (
        <div key={m.id} className="historico-item">
          {(i === 0 || diaDe(m.data) !== diaDe(mensagens[i - 1].data)) && (
            <span className="historico-dia">{formatarSeparadorDia(m.data)}</span>
          )}
          <MensagemItem mensagem={m} perspectiva={perspectiva} />
        </div>
      ))}
    </div>
  )
}

export default HistoricoMensagens
