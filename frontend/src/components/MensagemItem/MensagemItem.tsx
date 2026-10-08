import type { Mensagem } from '../../types'
import { formatarHora } from '../../utils/format'
import './MensagemItem.css'

// perspectiva define de quem é a mensagem alinhada à direita
function MensagemItem({ mensagem, perspectiva }: { mensagem: Mensagem; perspectiva: 'loja' | 'cliente' }) {
  const hora = formatarHora(mensagem.data)

  // eventos do sistema aparecem em linha
  if (mensagem.autor === 'sistema') {
    return (
      <div className="msg-sistema">
        {hora} • {mensagem.texto}
      </div>
    )
  }

  return (
    <div className={`msg ${mensagem.autor === perspectiva ? 'msg-meu' : ''} ${mensagem.interna ? 'msg-nota' : ''}`}>
      <span className="msg-autor">
        {mensagem.nome} • {hora}
        {mensagem.interna && <strong className="msg-nota-rotulo"> • Nota interna • Só a equipe vê</strong>}
      </span>
      <p>{mensagem.texto}</p>
      {mensagem.anexo && <span className="msg-anexo">📎 {mensagem.anexo}</span>}
    </div>
  )
}

export default MensagemItem
