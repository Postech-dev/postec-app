import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button/Button'
import CanalBadge from '../components/CanalBadge/CanalBadge'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EsteiraProgresso from '../components/EsteiraProgresso/EsteiraProgresso'
import HistoricoMensagens from '../components/HistoricoMensagens/HistoricoMensagens'
import type { HistoricoHandle } from '../components/HistoricoMensagens/HistoricoMensagens'
import Modal from '../components/Modal/Modal'
import PedidoCard from '../components/PedidoCard/PedidoCard'
import StatusBadge from '../components/StatusBadge/StatusBadge'
import Textarea from '../components/Textarea/Textarea'
import { useDados } from '../hooks/useDados'
import { useMensagens } from '../hooks/useMensagens'
import { useToast } from '../hooks/useToast'
import {
  buscarOcorrencia,
  enviarMensagem,
  listarMensagens,
  marcarComoLida,
  mudarStatus,
  observarMensagens,
} from '../services/ocorrencias.service'
import type { StatusOcorrencia } from '../types'
import { formatarData, formatarMoeda } from '../utils/format'
import { RESPOSTAS_RAPIDAS } from '../utils/respostasRapidas'
import './pages.css'
import './OcorrenciaDetalhePage.css'

const ORIENTACAO_PADRAO = 'Embale a peça e siga as instruções enviadas pela loja.'
const AVISO_EMAIL = 'O cliente recebe um e-mail ao concluir esta ação.'

function OcorrenciaDetalhePage() {
  const { protocolo = '' } = useParams()
  const navigate = useNavigate()
  const { mostrar } = useToast()
  const lista = (useLocation().state as { lista?: string } | null)?.lista ?? ''

  const carregar = useCallback(async () => {
    const o = await buscarOcorrencia(protocolo)
    await marcarComoLida(protocolo)
    return o
  }, [protocolo])
  const { dados: ocorrencia, setDados, erro, tentarDeNovo } = useDados(carregar)

  const fonte = useMemo(
    () => ({
      listar: () => listarMensagens(protocolo),
      observar: (aoMudar: Parameters<typeof observarMensagens>[1]) => observarMensagens(protocolo, aoMudar),
    }),
    [protocolo],
  )
  const { mensagens, recarregar } = useMensagens(fonte)

  const [modo, setModo] = useState<'mensagem' | 'nota'>('mensagem')
  const [texto, setTexto] = useState('')
  const [erroTexto, setErroTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [acaoAtiva, setAcaoAtiva] = useState(false)
  const [modalDevolucao, setModalDevolucao] = useState(false)
  const [orientacao, setOrientacao] = useState(ORIENTACAO_PADRAO)
  const [erroOrientacao, setErroOrientacao] = useState('')
  const [modalConfirm, setModalConfirm] = useState<{ titulo: string; acao: () => void } | null>(null)

  const campoRef = useRef<HTMLTextAreaElement>(null)
  const historicoRef = useRef<HistoricoHandle>(null)

  // rola para o fim após recarregar mensagens por novo envio
  const rolarAposEnvio = useRef(false)
  useEffect(() => {
    if (!rolarAposEnvio.current) return
    rolarAposEnvio.current = false
    historicoRef.current?.rolarParaFim(true)
  }, [mensagens])

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!ocorrencia) return <p className="carregando">Carregando…</p>

  async function atualizarOcorrencia() {
    setDados(await buscarOcorrencia(protocolo))
    await recarregar()
  }

  async function trocarStatus(status: StatusOcorrencia, destino?: string) {
    setAcaoAtiva(true)
    try {
      await mudarStatus(protocolo, status)
      if (destino) navigate(destino)
      else await atualizarOcorrencia()
    } finally {
      setAcaoAtiva(false)
    }
  }

  // ações que enviam e-mail ao cliente pedem confirmação antes
  function comConfirmacao(titulo: string, acao: () => void) {
    setModalConfirm({ titulo, acao })
  }

  async function confirmarDevolucao() {
    if (!orientacao.trim()) {
      setErroOrientacao('Escreva como o cliente deve devolver a peça. Ele recebe esse texto no portal.')
      return
    }
    setAcaoAtiva(true)
    try {
      await mudarStatus(protocolo, 'Aguardando devolução', orientacao.trim())
      setModalDevolucao(false)
      await atualizarOcorrencia()
      mostrar('Devolução solicitada. O cliente já vê as orientações no portal.')
    } finally {
      setAcaoAtiva(false)
    }
  }

  function usarResposta(resposta: string) {
    setTexto((atual) => (atual.trim() ? `${atual.trim()} ${resposta}` : resposta))
    setErroTexto('')
    campoRef.current?.focus()
  }

  async function enviar(e?: FormEvent) {
    e?.preventDefault()
    const interna = modo === 'nota'
    if (!texto.trim()) {
      setErroTexto(interna ? 'Escreva a nota antes de salvar.' : 'Escreva a mensagem antes de enviar.')
      return
    }
    setErroTexto('')
    setEnviando(true)
    try {
      await enviarMensagem(protocolo, texto.trim(), { interna })
      rolarAposEnvio.current = true
      setTexto('')
      await recarregar()
      mostrar(interna ? 'Nota interna salva. O cliente não vê.' : 'Mensagem enviada ao cliente.')
      campoRef.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  // Ctrl+Enter envia
  function aoTeclarNoCampo(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      enviar()
    }
  }

  const o = ocorrencia
  const base = `/ocorrencias/${o.protocolo}`
  const nota = modo === 'nota'
  const podeEnviar = !!texto.trim() && !enviando

  return (
    <div className="detalhe-pagina">

      {/* cabeçalho compacto: breadcrumb + título + esteira */}
      <header className="detalhe-header">
        <div className="detalhe-breadcrumb">
          <Link to={`/ocorrencias${lista}`} className="detalhe-back">
            ← Ocorrências
          </Link>
          <span aria-hidden="true">/</span>
          <span>{o.protocolo}</span>
        </div>

        <div className="detalhe-titulo-linha">
          <div className="detalhe-titulo-bloco">
            <h1 className="detalhe-titulo">{o.motivo}</h1>
            <p className="detalhe-meta">
              {o.protocolo} ·{' '}
              <Link to={`/pedidos/${o.pedido.id}`} className="detalhe-link-pedido">
                {o.pedido.numero}
              </Link>
              {' · '}Aberta em {formatarData(o.abertaEm)}
              {o.responsavel ? ` · ${o.responsavel}` : ' · Ninguém assumiu ainda'}
            </p>
          </div>
          <div className="detalhe-badges">
            <StatusBadge status={o.status} />
            <CanalBadge canal={o.canal} />
          </div>
        </div>

        <EsteiraProgresso status={o.status} />
      </header>

      {/* corpo: duas colunas */}
      <div className="detalhe-corpo">

        {/* coluna esquerda: histórico + composer */}
        <div className="detalhe-conversa">
          <div className="detalhe-historico-wrap">
            <HistoricoMensagens
              ref={historicoRef}
              mensagens={mensagens}
              perspectiva="loja"
            />
          </div>

          {/* composer fixo na base */}
          <form className="detalhe-composer" onSubmit={enviar} noValidate>
            <div className="detalhe-modos" role="group" aria-label="Tipo de resposta">
              <button
                type="button"
                aria-pressed={!nota}
                className={!nota ? 'detalhe-modo-ativo' : ''}
                onClick={() => setModo('mensagem')}
              >
                Mensagem para o cliente
              </button>
              <button
                type="button"
                aria-pressed={nota}
                className={nota ? 'detalhe-modo-ativo' : ''}
                onClick={() => setModo('nota')}
              >
                Nota interna
              </button>
            </div>

            {!nota && (
              <div className="detalhe-chips" role="group" aria-label="Respostas rápidas">
                {RESPOSTAS_RAPIDAS.map((r) => (
                  <button key={r} type="button" className="detalhe-chip" onClick={() => usarResposta(r)}>
                    {r}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              ref={campoRef}
              label={nota ? 'Nota interna (o cliente não vê)' : 'Mensagem para o cliente'}
              placeholder={nota ? 'Anote algo para a equipe… (Ctrl+Enter para salvar)' : 'Escreva sua resposta… (Ctrl+Enter para enviar)'}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={aoTeclarNoCampo}
              erro={erroTexto}
              className={nota ? 'detalhe-textarea-nota' : ''}
            />

            <div className={`detalhe-envio ${nota ? 'detalhe-envio-nota' : ''}`}>
              <span className="detalhe-dica">
                {nota ? '🔒 Só a equipe da loja vê esta nota.' : '📧 O cliente recebe por e-mail e vê no portal.'}
              </span>
              <Button
                type="submit"
                carregando={enviando}
                disabled={!podeEnviar}
                variante={nota ? 'secundario' : 'primario'}
              >
                {nota ? 'Salvar nota' : 'Enviar mensagem'}
              </Button>
            </div>
          </form>
        </div>

        {/* coluna direita sticky */}
        <div className="detalhe-lateral">

          {/* painel de ação */}
          <Card className="detalhe-acao">
            {o.status === 'Novo' && (
              <>
                <h2 className="card-titulo">Próxima ação</h2>
                <Button bloco carregando={acaoAtiva} onClick={() => trocarStatus('Em triagem')}>
                  Assumir e iniciar triagem
                </Button>
              </>
            )}

            {o.status === 'Em triagem' && (
              <>
                <h2 className="card-titulo">Como vamos resolver?</h2>
                <Button
                  variante="secundario" bloco
                  onClick={() => comConfirmacao('Solicitar devolução ao cliente?', () => setModalDevolucao(true))}
                >
                  Pedir devolução
                </Button>
                <Button
                  variante="secundario" bloco disabled={acaoAtiva}
                  onClick={() => comConfirmacao('Aprovar reenvio?', () => trocarStatus('Reenvio solicitado', `${base}/reenvio`))}
                >
                  Aprovar reenvio
                </Button>
                <Button
                  variante="secundario" bloco disabled={acaoAtiva}
                  onClick={() => comConfirmacao('Aprovar estorno?', () => trocarStatus('Estorno solicitado', `${base}/estorno`))}
                >
                  Aprovar estorno
                </Button>
              </>
            )}

            {o.status === 'Aguardando devolução' && (
              <>
                <h2 className="card-titulo">Produto recebido?</h2>
                <p className="detalhe-sub">Após receber a peça, registre a resolução.</p>
                <Button
                  variante="secundario" bloco disabled={acaoAtiva}
                  onClick={() => comConfirmacao('Confirmar recebimento e aprovar reenvio?', () => trocarStatus('Reenvio solicitado', `${base}/reenvio`))}
                >
                  Confirmar recebimento → Reenvio
                </Button>
                <Button
                  variante="secundario" bloco disabled={acaoAtiva}
                  onClick={() => comConfirmacao('Confirmar recebimento e aprovar estorno?', () => trocarStatus('Estorno solicitado', `${base}/estorno`))}
                >
                  Confirmar recebimento → Estorno
                </Button>
              </>
            )}

            {o.status === 'Reenvio solicitado' && (
              <>
                <h2 className="card-titulo">Reenvio solicitado</h2>
                <Button bloco to={`${base}/reenvio`}>
                  Registrar código de rastreio
                </Button>
              </>
            )}

            {o.status === 'Estorno solicitado' && (
              <>
                <h2 className="card-titulo">Estorno solicitado</h2>
                <Button bloco to={`${base}/estorno`}>
                  Registrar valor e transação
                </Button>
              </>
            )}

            {o.status === 'Concluído' && o.resolucao && (
              <>
                <h2 className="card-titulo">Caso concluído</h2>
                <p className="detalhe-sub">
                  {o.resolucao.tipo === 'Reenvio'
                    ? `Reenvio · Rastreio ${o.resolucao.codigoRastreio}`
                    : `Estorno · ${formatarMoeda(o.resolucao.valor ?? 0)}`}
                </p>
                <p className="detalhe-sub">
                  Concluído em {formatarData(o.resolucao.concluidoEm)}
                </p>
              </>
            )}
          </Card>

          <PedidoCard pedido={o.pedido} variante="loja" />

          <Card titulo="Cliente">
            <div className="detalhe-cliente">
              <strong>{o.pedido.cliente.nome}</strong>
              <span>{o.pedido.cliente.email}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* modal: pedir devolução */}
      <Modal
        aberto={modalDevolucao}
        onFechar={() => setModalDevolucao(false)}
        eyebrow="Confirmação"
        titulo="Solicitar devolução"
        acoes={
          <>
            <Button variante="secundario" onClick={() => setModalDevolucao(false)}>
              Cancelar
            </Button>
            <Button carregando={acaoAtiva} onClick={confirmarDevolucao}>
              Confirmar solicitação
            </Button>
          </>
        }
      >
        <p>A ocorrência ficará em Aguardando devolução. {AVISO_EMAIL}</p>
        <Textarea
          label="Orientações de devolução"
          obrigatorio
          value={orientacao}
          onChange={(e) => setOrientacao(e.target.value)}
          erro={erroOrientacao}
        />
      </Modal>

      {/* modal: confirmação antes de ações que enviam e-mail */}
      {modalConfirm && (
        <Modal
          aberto
          onFechar={() => setModalConfirm(null)}
          eyebrow="Confirmação"
          titulo={modalConfirm.titulo}
          acoes={
            <>
              <Button variante="secundario" onClick={() => setModalConfirm(null)}>
                Cancelar
              </Button>
              <Button onClick={() => { setModalConfirm(null); modalConfirm.acao() }}>
                Confirmar
              </Button>
            </>
          }
        >
          <p>{AVISO_EMAIL}</p>
        </Modal>
      )}
    </div>
  )
}

export default OcorrenciaDetalhePage
