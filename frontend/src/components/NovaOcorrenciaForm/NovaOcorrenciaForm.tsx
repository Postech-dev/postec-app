import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { criarOcorrenciaPelaLoja } from '../../services/ocorrencias.service'
import { MOTIVOS } from '../../services/portal.service'
import type { Pedido } from '../../types'
import { CANAIS, CANAIS_DA_LOJA, canalPorRotulo } from '../../utils/canais'
import { mascararCpf } from '../../utils/cpf'
import { formatarMoeda } from '../../utils/format'
import { RESPOSTAS_RAPIDAS } from '../../utils/respostasRapidas'
import Alert from '../Alert/Alert'
import Button from '../Button/Button'
import Card from '../Card/Card'
import PedidoBusca from '../PedidoBusca/PedidoBusca'
import Select from '../Select/Select'
import Textarea from '../Textarea/Textarea'
import './NovaOcorrenciaForm.css'

interface NovaOcorrenciaFormProps {
  // quando vem de "Abrir contato", o pedido já chega selecionado
  pedidoInicial: Pedido | null
}

const OPCOES_CANAL = CANAIS_DA_LOJA.map((c) => CANAIS[c])

function NovaOcorrenciaForm({ pedidoInicial }: NovaOcorrenciaFormProps) {
  const navigate = useNavigate()
  const { mostrar } = useToast()
  const [pedido, setPedido] = useState<Pedido | null>(pedidoInicial)
  const [confirmado, setConfirmado] = useState(!!pedidoInicial)
  const [motivo, setMotivo] = useState('')
  const [canal, setCanal] = useState('')
  const [relato, setRelato] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erros, setErros] = useState<{ motivo?: string; canal?: string; relato?: string; mensagem?: string; geral?: string }>({})
  const [enviando, setEnviando] = useState(false)

  function trocarPedido() {
    setPedido(null)
    setConfirmado(false)
  }

  function usarResposta(resposta: string) {
    setMensagem((atual) => (atual.trim() ? `${atual.trim()} ${resposta}` : resposta))
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!pedido) return
    const novos: typeof erros = {}
    if (!motivo) novos.motivo = 'Escolha o motivo do contato.'
    if (!canal) novos.canal = 'Escolha por onde o cliente falou com você.'
    if (!relato.trim()) novos.relato = 'Escreva o que o cliente relatou. Fica anotado para a equipe.'
    if (!mensagem.trim()) novos.mensagem = 'Escreva a primeira mensagem para o cliente. Ela vai junto com o e-mail.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      const o = await criarOcorrenciaPelaLoja(pedido, {
        motivo,
        canal: canalPorRotulo(canal) ?? 'outro',
        relato: relato.trim(),
        primeiraMensagem: mensagem.trim(),
      })
      mostrar(`Ocorrência ${o.protocolo} aberta. O cliente recebeu o e-mail com o link.`)
      navigate(`/ocorrencias/${o.protocolo}`)
    } catch (err) {
      setErros({ geral: `${(err as Error).message} Seus dados continuam aqui; tente enviar de novo.` })
    } finally {
      setEnviando(false)
    }
  }

  // passo 1: escolher o pedido
  if (!pedido || !confirmado) {
    return (
      <Card titulo="Passo 1 de 2 • Escolha o pedido">
        <PedidoBusca onSelecionar={setPedido} />
        {pedido && (
          <div className="nova-selecionado">
            <ResumoPedido pedido={pedido} />
            <Button onClick={() => setConfirmado(true)}>Continuar com este pedido</Button>
          </div>
        )}
      </Card>
    )
  }

  // passo 2: dados do contato
  return (
    <form className="nova-form" onSubmit={enviar} noValidate>
      <Card titulo="Passo 2 de 2 • Dados do contato">
        <div className="nova-selecionado">
          <ResumoPedido pedido={pedido} />
          <Button type="button" variante="fantasma" onClick={trocarPedido}>
            Trocar pedido
          </Button>
        </div>

        <div className="nova-linha">
          <Select
            label="Motivo"
            obrigatorio
            placeholder="Selecione o motivo"
            opcoes={MOTIVOS}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            erro={erros.motivo}
          />
          <Select
            label="Canal de origem"
            obrigatorio
            placeholder="Por onde o cliente falou?"
            opcoes={OPCOES_CANAL}
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            erro={erros.canal}
          />
        </div>

        <Textarea
          label="Relato do cliente"
          obrigatorio
          maximo={1000}
          placeholder="O que o cliente contou? Fica como nota interna, só a equipe vê."
          value={relato}
          onChange={(e) => setRelato(e.target.value)}
          erro={erros.relato}
        />

        <div className="nova-mensagem">
          <div className="nova-chips" role="group" aria-label="Respostas rápidas">
            {RESPOSTAS_RAPIDAS.map((r) => (
              <button key={r} type="button" className="nova-chip" onClick={() => usarResposta(r)}>
                {r}
              </button>
            ))}
          </div>
          <Textarea
            label="Primeira mensagem para o cliente"
            obrigatorio
            maximo={1000}
            placeholder="Escreva como se apresentaria ao cliente…"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            erro={erros.mensagem}
          />
        </div>

        <Alert>O cliente receberá um e-mail com o link para acompanhar e responder pelo portal.</Alert>

        {erros.geral && (
          <span className="campo-erro" role="alert">
            {erros.geral}
          </span>
        )}
        <div className="form-acoes">
          <Button type="button" variante="secundario" onClick={() => navigate('/ocorrencias')}>
            Cancelar
          </Button>
          <Button type="submit" carregando={enviando}>
            Abrir ocorrência e enviar
          </Button>
        </div>
      </Card>
    </form>
  )
}

function ResumoPedido({ pedido }: { pedido: Pedido }) {
  return (
    <dl className="nova-resumo">
      <div>
        <dt>Pedido</dt>
        <dd>{pedido.numero}</dd>
      </div>
      <div>
        <dt>Cliente</dt>
        <dd>
          {pedido.cliente.nome} • {mascararCpf(pedido.cliente.cpf)}
        </dd>
      </div>
      <div>
        <dt>E-mail</dt>
        <dd>{pedido.cliente.email}</dd>
      </div>
      <div>
        <dt>Produto</dt>
        <dd>
          {pedido.produto} • {formatarMoeda(pedido.valor)}
        </dd>
      </div>
    </dl>
  )
}

export default NovaOcorrenciaForm
