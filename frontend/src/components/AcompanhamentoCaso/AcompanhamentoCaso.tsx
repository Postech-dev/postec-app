import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMensagens } from '../../hooks/useMensagens'
import { useToast } from '../../hooks/useToast'
import { listarMensagensPortal, observarMensagensPortal, responderSolicitacao } from '../../services/portal.service'
import type { Mensagem, Ocorrencia, PortalContexto } from '../../types'
import { formatarDataHora } from '../../utils/format'
import { ETAPAS_CLIENTE, STATUS_CLIENTE, textoPrazo } from '../../utils/statusCliente'
import Button from '../Button/Button'
import Card from '../Card/Card'
import CopyButton from '../CopyButton/CopyButton'
import HistoricoMensagens from '../HistoricoMensagens/HistoricoMensagens'
import PageHeader from '../PageHeader/PageHeader'
import StatusBadge from '../StatusBadge/StatusBadge'
import Textarea from '../Textarea/Textarea'
import Timeline from '../Timeline/Timeline'
import type { PassoTimeline } from '../Timeline/Timeline'
import '../../pages/portal.css'

// linha do tempo completa: passos feitos, o atual e os que ainda vêm
function montarPassos(o: Ocorrencia, mensagens: Mensagem[]): PassoTimeline[] {
  const atual = STATUS_CLIENTE[o.status].etapa
  const concluida = o.status === 'Concluído'
  const houveDevolucao = mensagens.some((m) => m.autor === 'sistema' && m.texto.includes('Devolução solicitada'))

  return ETAPAS_CLIENTE.map((rotulo, indice) => ({ rotulo, indice }))
    // a devolução só aparece se ainda pode acontecer ou se aconteceu
    .filter((p) => p.indice !== 2 || atual <= 2 || houveDevolucao)
    .map((p) => {
      const estado = concluida || p.indice < atual ? 'feito' : p.indice === atual ? 'atual' : 'futuro'
      return {
        rotulo: p.indice === 2 && atual >= 2 ? 'Devolução' : p.rotulo,
        estado,
        detalhe: p.indice === 0 ? formatarDataHora(o.abertaEm) : undefined,
      } as PassoTimeline
    })
}

interface AcompanhamentoCasoProps {
  ocorrencia: Ocorrencia
  slug: string
  // pede à página para buscar o caso de novo (status pode ter mudado)
  onAtualizar: () => Promise<void>
}

// tela de acompanhamento do cliente; serve para o acesso por protocolo e pelo link do e-mail
function AcompanhamentoCaso({ ocorrencia: o, slug, onAtualizar }: AcompanhamentoCasoProps) {
  const { loja } = useOutletContext<PortalContexto>()
  const { mostrar } = useToast()
  const fonte = useMemo(
    () => ({
      listar: () => listarMensagensPortal(slug, o.protocolo),
      observar: (aoMudar: (m: Mensagem[]) => void) => observarMensagensPortal(slug, o.protocolo, aoMudar),
    }),
    [slug, o.protocolo],
  )
  const { mensagens, recarregar } = useMensagens(fonte)

  const [texto, setTexto] = useState('')
  const [anexo, setAnexo] = useState<File | null>(null)
  const [erroTexto, setErroTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const anexoRef = useRef<HTMLInputElement>(null)

  async function responder(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim()) {
      setErroTexto('Escreva sua resposta antes de enviar.')
      return
    }
    setErroTexto('')
    setEnviando(true)
    try {
      await responderSolicitacao(slug, o.protocolo, texto.trim())
      await recarregar()
      await onAtualizar()
      setTexto('')
      setAnexo(null)
      mostrar('Resposta enviada. A loja foi avisada.')
    } finally {
      setEnviando(false)
    }
  }

  const info = STATUS_CLIENTE[o.status]
  const concluida = o.status === 'Concluído'
  const devolver = o.status === 'Aguardando devolução'

  return (
    <>
      <PageHeader
        eyebrow={`${o.protocolo} · ${o.pedido.numero}`}
        titulo={concluida ? 'Sua solicitação foi resolvida.' : 'Sua solicitação está em andamento.'}
        subtitulo="Veja as atualizações e converse com a loja."
        acoes={
          <div className="portal-selos">
            <StatusBadge status={o.status} cliente />
            {info.acaoNecessaria && <span className="portal-acao">Ação necessária</span>}
          </div>
        }
      />

      {devolver && (
        <Card className="portal-destaque" titulo="Ação necessária: devolva o produto">
          <p>{o.orientacaoDevolucao ?? 'A loja vai enviar as orientações de devolução em breve. Você será avisado.'}</p>
          {loja.enderecoDevolucao && (
            <>
              <dl className="portal-lista">
                <div>
                  <dt>Endereço para devolução</dt>
                  <dd>{loja.enderecoDevolucao}</dd>
                </div>
              </dl>
              <CopyButton texto={loja.enderecoDevolucao} rotulo="Copiar endereço" />
            </>
          )}
        </Card>
      )}

      <Card titulo="O que acontece agora">
        <div className="portal-agora">
          <p>{info.agora}</p>
          {!concluida && <p className="portal-nota">{textoPrazo(loja.prazoRespostaDias)}</p>}
          {concluida && <Button to={`/portal/${slug}/concluido/${o.protocolo}`}>Ver como foi resolvido</Button>}
        </div>
      </Card>

      <Card titulo="Andamento">
        <Timeline passos={montarPassos(o, mensagens)} />
      </Card>

      <Card titulo="Mensagens">
        <HistoricoMensagens mensagens={mensagens.filter((m) => m.autor !== 'sistema')} perspectiva="cliente" />
      </Card>

      <Card>
        <form className="portal-bloco" onSubmit={responder} noValidate>
          <Textarea label="Sua resposta" value={texto} onChange={(e) => setTexto(e.target.value)} erro={erroTexto} />
          <input
            ref={anexoRef}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setAnexo(e.target.files?.[0] ?? null)}
          />
          {anexo && <span className="portal-nota">📎 {anexo.name}</span>}
          <div className="portal-botoes">
            <Button type="submit" carregando={enviando}>
              Responder
            </Button>
            <Button type="button" variante="secundario" onClick={() => anexoRef.current?.click()}>
              Anexar
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}

export default AcompanhamentoCaso
