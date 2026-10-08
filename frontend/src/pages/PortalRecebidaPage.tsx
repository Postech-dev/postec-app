import { useCallback } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import CopyButton from '../components/CopyButton/CopyButton'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import PageHeader from '../components/PageHeader/PageHeader'
import StatusBadge from '../components/StatusBadge/StatusBadge'
import { useDados } from '../hooks/useDados'
import { acompanharOcorrencia } from '../services/portal.service'
import type { PortalContexto } from '../types'
import './portal.css'

function PortalRecebidaPage() {
  const { slug = '', protocolo = '' } = useParams()
  const { loja } = useOutletContext<PortalContexto>()
  const carregar = useCallback(() => acompanharOcorrencia(slug, protocolo), [slug, protocolo])
  const { dados: ocorrencia, erro, tentarDeNovo } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!ocorrencia) return <p className="portal-nota">Carregando…</p>

  return (
    <>
      <PageHeader
        eyebrow="ESTAMOS COM VOCÊ"
        titulo={`Tudo certo, ${ocorrencia.pedido.cliente.nome.split(' ')[0]}.`}
        subtitulo={`A equipe da ${loja.nome} vai analisar a sua solicitação.`}
      />
      <Card titulo="Seu protocolo">
        <strong className="portal-titulo">{ocorrencia.protocolo}</strong>
        <CopyButton texto={ocorrencia.protocolo} rotulo="Copiar protocolo" />
        <div>
          <StatusBadge status={ocorrencia.status} cliente />
        </div>
        <dl className="portal-lista">
          <div>
            <dt>Pedido</dt>
            <dd>{ocorrencia.pedido.numero}</dd>
          </div>
          <div>
            <dt>Motivo</dt>
            <dd>{ocorrencia.motivo}</dd>
          </div>
        </dl>
      </Card>
      <p className="portal-nota">
        Enviamos uma confirmação para o seu e-mail. Guarde o protocolo: com ele você acompanha a solicitação quando
        quiser.
      </p>
      <div className="portal-botoes">
        <Button to={`/portal/${slug}/acompanhar/${ocorrencia.protocolo}`}>Acompanhar minha solicitação</Button>
        <Button variante="secundario" to={`/portal/${slug}`}>
          Voltar ao início
        </Button>
      </div>
    </>
  )
}

export default PortalRecebidaPage
