import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import type { Mensagem } from '../../types'
import { diaDe, formatarSeparadorDia } from '../../utils/format'
import MensagemItem from '../MensagemItem/MensagemItem'
import './HistoricoMensagens.css'

export interface HistoricoHandle {
  rolarParaFim: (suave?: boolean) => void
}

interface HistoricoMensagensProps {
  mensagens: Mensagem[]
  perspectiva: 'loja' | 'cliente'
}

const HistoricoMensagens = forwardRef<HistoricoHandle, HistoricoMensagensProps>(
  function HistoricoMensagens({ mensagens, perspectiva }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const fimRef = useRef<HTMLDivElement>(null)
    const [longeDoFim, setLongeDoFim] = useState(false)

    function rolarParaFim(suave = false) {
      fimRef.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'instant', block: 'end' })
    }

    useImperativeHandle(ref, () => ({ rolarParaFim }))

    // rola para o fim na montagem (sem animação)
    useEffect(() => {
      rolarParaFim(false)
    }, [])

    // detecta se o usuário rolou para cima
    function aoRolar() {
      const el = containerRef.current
      if (!el) return
      const distanciaDoFim = el.scrollHeight - el.scrollTop - el.clientHeight
      setLongeDoFim(distanciaDoFim > 120)
    }

    if (mensagens.length === 0) {
      return <p className="historico-vazio">Nenhuma mensagem ainda.</p>
    }

    return (
      <div className="historico-container" ref={containerRef} onScroll={aoRolar}>
        <div className="historico">
          {mensagens.map((m, i) => (
            <div key={m.id} className="historico-item">
              {(i === 0 || diaDe(m.data) !== diaDe(mensagens[i - 1].data)) && (
                <span className="historico-dia">{formatarSeparadorDia(m.data)}</span>
              )}
              <MensagemItem mensagem={m} perspectiva={perspectiva} />
            </div>
          ))}
          <div ref={fimRef} />
        </div>

        {longeDoFim && (
          <button
            type="button"
            className="historico-ir-fim"
            onClick={() => rolarParaFim(true)}
            aria-label="Ir para a última mensagem"
          >
            ↓ Última mensagem
          </button>
        )}
      </div>
    )
  },
)

export default HistoricoMensagens
