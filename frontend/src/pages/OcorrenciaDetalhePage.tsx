import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink/BackLink'
import Button from '../components/Button/Button'
import CanalBadge from '../components/CanalBadge/CanalBadge'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import HistoricoMensagens from '../components/HistoricoMensagens/HistoricoMensagens'
import Modal from '../components/Modal/Modal'
import PageHeader from '../components/PageHeader/PageHeader'
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
import { formatarDataHora, formatarMoeda } from '../utils/format'
import { RESPOSTAS_RAPIDAS } from '../utils/respostasRapidas'
import './pages.css'
import './OcorrenciaDetalhePage.css'

const ORIENTACAO_PADRAO = 'Embale a peça e siga as instruções enviadas pela loja.'
const MOTIVO_CONCLUIR = 'Registre os dados da resolução para concluir'

function OcorrenciaDetalhePage() {
  const { protocolo = '' } = useParams()
  const navigate = useNavigate()
  const { mostrar } = useToast()
  // volta para a lista com a busca e os filtros que estavam ativos
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

  const campoRef = useRef<HTMLTextAreaElement>(null)
  const fimRef = useRef<HTMLDivElement>(null)
  const rolarRef = useRef(false)

  // depois de enviar, rola o histórico até a mensagem nova
  useEffect(() => {
    if (!rolarRef.current) return
    rolarRef.current = false
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const interna = modo === 'nota'
    if (!texto.trim()) {
      setErroTexto(interna ? 'Escreva a nota antes de salvar.' : 'Escreva a mensagem antes de enviar.')
      return
    }
    setErroTexto('')
    setEnviando(true)
    try {
      await enviarMensagem(protocolo, texto.trim(), { interna })
      rolarRef.current = true
      setTexto('')
      await recarregar()
      mostrar(interna ? 'Nota interna salva. O cliente não vê.' : 'Mensagem enviada ao cliente.')
      campoRef.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  const o = ocorrencia
  const base = `/ocorrencias/${o.protocolo}`
  const nota = modo === 'nota'

  return (
    <div className="pagina">
      <BackLink to={`/ocorrencias${lista}`}>Voltar às ocorrências</BackLink>
      <PageHeader
        eyebrow={`${o.protocolo} · ${o.pedido.numero}`}
        titulo={o.motivo}
        subtitulo={`Aberta em ${formatarDataHora(o.abertaEm)}${o.responsavel ? ` • Responsável: ${o.responsavel}` : ' • Ninguém assumiu ainda'}`}
        acoes={
          <div className="detalhe-status">
            <div className="detalhe-badges">
              <StatusBadge status={o.status} />
              <CanalBadge canal={o.canal} />
            </div>
            <span>Cliente notificado por e-mail</span>
          </div>
        }
      />

      <div className="pagina-grid">
        <Card titulo="Histórico de mensagens">
          <HistoricoMensagens mensagens={mensagens} perspectiva="loja" />
          <div ref={fimRef} />

          <form className="form-coluna" onSubmit={enviar} noValidate>
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
              placeholder={nota ? 'Anote algo para a equipe…' : 'Escreva sua resposta…'}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              erro={erroTexto}
            />
            <div className="detalhe-envio">
              <span>{nota ? 'Só a equipe da loja vê esta nota.' : 'O cliente acompanha pelo portal.'}</span>
              <Button type="submit" carregando={enviando}>
                {nota ? 'Salvar nota' : 'Enviar mensagem'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="pagina-coluna">
          <PedidoCard pedido={o.pedido} variante="loja" />
          <Card titulo="Cliente">
            <div className="detalhe-cliente">
              <strong>{o.pedido.cliente.nome}</strong>
              <span>{o.pedido.cliente.email}</span>
            </div>
          </Card>

          <Card className="detalhe-acao">
            {o.status === 'Novo' && (
              <>
                <h2 className="card-titulo">Começar atendimento</h2>
                <Button bloco carregando={acaoAtiva} onClick={() => trocarStatus('Em triagem')}>
                  Assumir e iniciar triagem
                </Button>
              </>
            )}

            {(o.status === 'Em triagem' || o.status === 'Aguardando devolução') && (
              <>
                <h2 className="card-titulo">
                  {o.status === 'Em triagem' ? 'Como vamos resolver?' : 'Devolução recebida?'}
                </h2>
                {o.status === 'Aguardando devolução' && (
                  <p className="detalhe-sub">Após receber a peça, registre a resolução.</p>
                )}
                {o.status === 'Em triagem' && (
                  <Button variante="secundario" bloco onClick={() => setModalDevolucao(true)}>
                    Solicitar devolução
                  </Button>
                )}
                <Button
                  variante="secundario"
                  bloco
                  disabled={acaoAtiva}
                  onClick={() => trocarStatus('Reenvio solicitado', `${base}/reenvio`)}
                >
                  Solicitar reenvio
                </Button>
                <Button
                  variante="secundario"
                  bloco
                  disabled={acaoAtiva}
                  onClick={() => trocarStatus('Estorno solicitado', `${base}/estorno`)}
                >
                  Solicitar estorno
                </Button>
                <Button bloco motivoDesabilitado={MOTIVO_CONCLUIR}>
                  Concluir ocorrência
                </Button>
              </>
            )}

            {o.status === 'Reenvio solicitado' && (
              <>
                <h2 className="card-titulo">Reenvio solicitado</h2>
                <Button bloco to={`${base}/reenvio`}>
                  Registrar reenvio
                </Button>
              </>
            )}

            {o.status === 'Estorno solicitado' && (
              <>
                <h2 className="card-titulo">Estorno solicitado</h2>
                <Button bloco to={`${base}/estorno`}>
                  Registrar estorno
                </Button>
              </>
            )}

            {o.status === 'Concluído' && o.resolucao && (
              <>
                <h2 className="card-titulo">Caso concluído</h2>
                <p className="detalhe-sub">
                  {o.resolucao.tipo === 'Reenvio'
                    ? `Reenvio registrado • rastreio ${o.resolucao.codigoRastreio}`
                    : `Estorno registrado • ${formatarMoeda(o.resolucao.valor ?? 0)}`}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

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
        <p>A ocorrência ficará em Aguardando devolução. Informe ao cliente como devolver o produto.</p>
        <Textarea
          label="Orientações de devolução"
          obrigatorio
          value={orientacao}
          onChange={(e) => setOrientacao(e.target.value)}
          erro={erroOrientacao}
        />
      </Modal>
    </div>
  )
}

export default OcorrenciaDetalhePage
