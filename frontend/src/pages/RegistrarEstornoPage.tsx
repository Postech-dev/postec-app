import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import FileUpload from '../components/FileUpload/FileUpload'
import Input from '../components/Input/Input'
import Modal from '../components/Modal/Modal'
import ResolucaoLayout from '../components/ResolucaoLayout/ResolucaoLayout'
import { useDados } from '../hooks/useDados'
import { buscarOcorrencia, resolverEstorno } from '../services/ocorrencias.service'
import { formatarMoeda, lerValor } from '../utils/format'
import './pages.css'

function RegistrarEstornoPage() {
  const { protocolo = '' } = useParams()
  const navigate = useNavigate()
  const carregar = useCallback(() => buscarOcorrencia(protocolo), [protocolo])
  const { dados: ocorrencia, erro, tentarDeNovo } = useDados(carregar)

  const [valorDigitado, setValor] = useState<string | null>(null)
  const [transacao, setTransacao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erros, setErros] = useState<{ valor?: string; comprovante?: string }>({})
  const [etapa, setEtapa] = useState<'preencher' | 'revisar'>('preencher')
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!ocorrencia) return <p className="carregando">Carregando…</p>

  // sugere o valor do pedido, que a loja pode ajustar (estorno parcial)
  const valor = valorDigitado ?? ocorrencia.pedido.valor.toFixed(2).replace('.', ',')
  const numero = lerValor(valor)

  function revisar() {
    const novos: typeof erros = {}
    if (!(numero > 0)) novos.valor = 'Informe o valor estornado, por exemplo 189,90.'
    else if (ocorrencia && numero > ocorrencia.pedido.valor) {
      novos.valor = `O valor passa do total do pedido (${formatarMoeda(ocorrencia.pedido.valor)}). Confira e corrija.`
    }
    if (!arquivo && !transacao.trim()) {
      novos.comprovante = 'Anexe o comprovante ou informe o ID da transação para o cliente poder conferir.'
    }
    setErros(novos)
    if (Object.keys(novos).length === 0) setEtapa('revisar')
  }

  async function confirmar() {
    setEnviando(true)
    try {
      await resolverEstorno(protocolo, {
        valor: numero,
        transacao: transacao.trim() || undefined,
        comprovante: arquivo?.name,
      })
      setConcluido(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <ResolucaoLayout
        ocorrencia={ocorrencia}
        titulo="Registrar estorno"
        subtitulo="Registre o estorno realizado e compartilhe o comprovante."
        rotuloConfirmar="Confirmar estorno e concluir"
        etapa={etapa}
        carregando={enviando}
        onRevisar={revisar}
        onVoltarEditar={() => setEtapa('preencher')}
        onConfirmar={confirmar}
        revisao={
          <dl className="revisao">
            <div>
              <dt>Valor estornado</dt>
              <dd>{formatarMoeda(numero || 0)}</dd>
            </div>
            {transacao.trim() && (
              <div>
                <dt>ID da transação</dt>
                <dd>{transacao.trim()}</dd>
              </div>
            )}
            {arquivo && (
              <div>
                <dt>Comprovante</dt>
                <dd>{arquivo.name}</dd>
              </div>
            )}
          </dl>
        }
      >
        <Card titulo="Dados do estorno">
          <div className="form-coluna">
            <Input
              label="Valor estornado"
              obrigatorio
              placeholder="R$ 189,90"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              erro={erros.valor}
            />
            <Input
              label="ID da transação"
              placeholder="PIX 123456"
              value={transacao}
              onChange={(e) => setTransacao(e.target.value)}
            />
            <FileUpload
              rotulo="Anexar comprovante *"
              dica="PDF, JPG ou PNG • até 10 MB"
              arquivo={arquivo}
              onChange={setArquivo}
              erro={erros.comprovante}
            />
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

export default RegistrarEstornoPage
