import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink/BackLink'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import FileUpload from '../components/FileUpload/FileUpload'
import PageHeader from '../components/PageHeader/PageHeader'
import Select from '../components/Select/Select'
import Textarea from '../components/Textarea/Textarea'
import { MOTIVOS, abrirOcorrencia } from '../services/portal.service'
import type { Pedido } from '../types'
import './portal.css'

const MAXIMO = 500

// ajuda curta que muda conforme o motivo escolhido
const DICAS: Record<string, string> = {
  'Produto com defeito': 'Conte o que está errado e anexe uma foto do defeito. Isso agiliza a análise.',
  Arrependimento: 'Você pode devolver a peça sem uso e com etiqueta. Se quiser, diga se prefere troca ou estorno.',
  'Tamanho incorreto': 'Diga o tamanho que você pediu e o que chegou. Se puder, anexe uma foto da etiqueta.',
  'Atraso de entrega': 'Informe a data prevista de entrega e, se tiver, o código de rastreio.',
}

function PortalAbrirPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const pedido = (useLocation().state as { pedido?: Pedido } | null)?.pedido
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erros, setErros] = useState<{ motivo?: string; descricao?: string; geral?: string }>({})
  const [enviando, setEnviando] = useState(false)

  if (!pedido) return <Navigate to={`/portal/${slug}`} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!pedido) return
    const novos: typeof erros = {}
    if (!motivo) novos.motivo = 'Escolha o motivo que mais se parece com o seu caso.'
    if (!descricao.trim()) novos.descricao = 'Descreva o que aconteceu, com suas palavras. Poucas linhas já ajudam.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      const o = await abrirOcorrencia(slug, pedido.numero, motivo, descricao.trim(), arquivo?.name)
      navigate(`/portal/${slug}/recebida/${o.protocolo}`, { replace: true })
    } catch (err) {
      setErros({ geral: `${(err as Error).message} Seus dados continuam aqui; tente enviar de novo.` })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <BackLink to={`/portal/${slug}/pedido`} state={{ pedido }}>
        Meu pedido
      </BackLink>
      <PageHeader titulo="Conte o que aconteceu." subtitulo="Sua mensagem será enviada à equipe da loja." />
      <Card>
        <form className="portal-bloco" onSubmit={enviar} noValidate>
          <div className="portal-bloco" style={{ gap: 8 }}>
            <Select
              label="Motivo"
              obrigatorio
              placeholder="Selecione o motivo"
              opcoes={MOTIVOS}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              erro={erros.motivo}
            />
            {motivo && <p className="portal-dica">{DICAS[motivo]}</p>}
          </div>
          <Textarea
            label="Descrição"
            obrigatorio
            maximo={MAXIMO}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            erro={erros.descricao}
          />
          <FileUpload
            rotulo="Adicionar foto ou evidência"
            dica="Opcional • JPG, PNG ou PDF, até 10 MB"
            arquivo={arquivo}
            onChange={setArquivo}
          />
          {erros.geral && (
            <span className="campo-erro" role="alert">
              {erros.geral}
            </span>
          )}
          <Button type="submit" bloco carregando={enviando}>
            Enviar solicitação
          </Button>
        </form>
      </Card>
    </>
  )
}

export default PortalAbrirPage
