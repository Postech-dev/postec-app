import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert/Alert'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import Input from '../components/Input/Input'
import Modal from '../components/Modal/Modal'
import ResolucaoLayout from '../components/ResolucaoLayout/ResolucaoLayout'
import { useDados } from '../hooks/useDados'
import { buscarOcorrencia, resolverReenvio } from '../services/ocorrencias.service'
import { tamanhoCurto } from '../utils/format'
import { normalizarRastreio, rastreioValido } from '../utils/rastreio'
import './pages.css'

function RegistrarReenvioPage() {
  const { protocolo = '' } = useParams()
  const navigate = useNavigate()
  const carregar = useCallback(() => buscarOcorrencia(protocolo), [protocolo])
  const { dados: ocorrencia, erro, tentarDeNovo } = useDados(carregar)

  const [rastreio, setRastreio] = useState('')
  const [itensDigitados, setItens] = useState<string | null>(null)
  const [erros, setErros] = useState<{ rastreio?: string; itens?: string }>({})
  const [etapa, setEtapa] = useState<'preencher' | 'revisar'>('preencher')
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!ocorrencia) return <p className="carregando">Carregando…</p>

  // sugere o item do pedido original, que a loja pode ajustar
  const itens = itensDigitados ?? `1 × ${ocorrencia.pedido.produto} • ${tamanhoCurto(ocorrencia.pedido.detalhe)}`

  function revisar() {
    const novos: typeof erros = {}
    if (!rastreio) novos.rastreio = 'Informe o novo código de rastreio. Ele está no comprovante de postagem.'
    else if (!rastreioValido(rastreio)) novos.rastreio = 'Código inválido. Use 2 letras, 9 números e BR, como AA987654321BR.'
    if (!itens.trim()) novos.itens = 'Informe quais itens foram reenviados, por exemplo "1 × Vestido • Tam. M".'
    setErros(novos)
    if (Object.keys(novos).length === 0) setEtapa('revisar')
  }

  async function confirmar() {
    setEnviando(true)
    try {
      await resolverReenvio(protocolo, { codigoRastreio: rastreio, itens: itens.trim() })
      setConcluido(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <ResolucaoLayout
        ocorrencia={ocorrencia}
        titulo="Registrar reenvio"
        subtitulo="Informe os itens e o rastreio do novo envio."
        rotuloConfirmar="Confirmar reenvio e concluir"
        etapa={etapa}
        carregando={enviando}
        onRevisar={revisar}
        onVoltarEditar={() => setEtapa('preencher')}
        onConfirmar={confirmar}
        revisao={
          <dl className="revisao">
            <div>
              <dt>Novo código de rastreio</dt>
              <dd>{rastreio}</dd>
            </div>
            <div>
              <dt>Itens reenviados</dt>
              <dd>{itens}</dd>
            </div>
          </dl>
        }
      >
        <Card titulo="Dados do novo envio">
          <div className="form-coluna">
            <Input
              label="Novo código de rastreio"
              obrigatorio
              placeholder="AA987654321BR"
              value={rastreio}
              onChange={(e) => setRastreio(normalizarRastreio(e.target.value))}
              maxLength={13}
              autoCapitalize="characters"
              erro={erros.rastreio}
            />
            <Input
              label="Itens reenviados"
              obrigatorio
              placeholder="1 × Vestido Midi Linho Cru • Tam. M"
              value={itens}
              onChange={(e) => setItens(e.target.value)}
              erro={erros.itens}
            />
            <Alert>Confira o código de rastreio antes de concluir.</Alert>
          </div>
        </Card>
      </ResolucaoLayout>

      <Modal
        aberto={concluido}
        onFechar={() => navigate('/ocorrencias')}
        eyebrow="Concluído"
        titulo="Ocorrência concluída"
        acoes={<Button onClick={() => navigate('/ocorrencias')}>Voltar à lista</Button>}
      >
        <p>Os dados da resolução foram registrados. O cliente será notificado por e-mail.</p>
      </Modal>
    </>
  )
}

export default RegistrarReenvioPage
