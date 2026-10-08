import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Ocorrencia } from '../../types'
import Alert from '../Alert/Alert'
import BackLink from '../BackLink/BackLink'
import Button from '../Button/Button'
import Card from '../Card/Card'
import PageHeader from '../PageHeader/PageHeader'
import ResumoCaso from '../ResumoCaso/ResumoCaso'
import StatusBadge from '../StatusBadge/StatusBadge'
import '../Input/Input.css'
import './ResolucaoLayout.css'

interface ResolucaoLayoutProps {
  ocorrencia: Ocorrencia
  titulo: string
  subtitulo: string
  rotuloConfirmar: string
  etapa: 'preencher' | 'revisar'
  carregando: boolean
  erro?: string
  // valida o formulário; se estiver ok, a página muda para a revisão
  onRevisar: () => void
  onVoltarEditar: () => void
  onConfirmar: () => void
  // o que o cliente vai receber, mostrado na revisão
  revisao: ReactNode
  children: ReactNode
}

// layout comum de registrar reenvio e estorno, em duas etapas: preencher e revisar
function ResolucaoLayout({
  ocorrencia,
  titulo,
  subtitulo,
  rotuloConfirmar,
  etapa,
  carregando,
  erro,
  onRevisar,
  onVoltarEditar,
  onConfirmar,
  revisao,
  children,
}: ResolucaoLayoutProps) {
  const navigate = useNavigate()
  const voltar = `/ocorrencias/${ocorrencia.protocolo}`
  const revisando = etapa === 'revisar'

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (revisando) onConfirmar()
    else onRevisar()
  }

  return (
    <form className="resolucao" onSubmit={enviar} noValidate>
      <BackLink to={voltar}>Detalhe da ocorrência</BackLink>
      <PageHeader
        eyebrow={`RESOLUÇÃO · ${ocorrencia.protocolo}`}
        titulo={revisando ? `Revise: ${titulo.toLowerCase()}` : titulo}
        subtitulo={revisando ? 'Confira o que o cliente vai receber antes de concluir.' : subtitulo}
        acoes={<StatusBadge status={ocorrencia.status} />}
      />

      {revisando ? (
        <div className="resolucao-grid">
          <Card titulo="O cliente vai receber por e-mail">{revisao}</Card>
          <ResumoCaso ocorrencia={ocorrencia} />
        </div>
      ) : (
        <div className="resolucao-grid">
          {children}
          <ResumoCaso ocorrencia={ocorrencia} />
        </div>
      )}

      {revisando && <Alert>Ao concluir, o caso é encerrado e esta ação não pode ser desfeita.</Alert>}
      {erro && (
        <p className="campo-erro" role="alert">
          {erro}
        </p>
      )}

      <footer className="resolucao-rodape">
        <div className="resolucao-aviso">
          {!revisando && <span>* Campos obrigatórios</span>}
          <span>Ao confirmar, o caso será concluído e o cliente receberá os dados por e-mail.</span>
        </div>
        <div className="resolucao-botoes">
          {revisando ? (
            <Button type="button" variante="secundario" onClick={onVoltarEditar}>
              Voltar e editar
            </Button>
          ) : (
            <Button type="button" variante="secundario" onClick={() => navigate(voltar)}>
              Cancelar
            </Button>
          )}
          <Button type="submit" carregando={carregando}>
            {revisando ? rotuloConfirmar : 'Revisar antes de concluir'}
          </Button>
        </div>
      </footer>
    </form>
  )
}

export default ResolucaoLayout
