import { useCallback } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import CopyButton from '../components/CopyButton/CopyButton'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import PageHeader from '../components/PageHeader/PageHeader'
import { useDados } from '../hooks/useDados'
import { acompanharOcorrencia } from '../services/portal.service'
import { formatarData, formatarMoeda } from '../utils/format'
import { linkCorreios } from '../utils/rastreio'
import './portal.css'

function PortalConcluidoPage() {
  const { slug = '', protocolo = '' } = useParams()
  const carregar = useCallback(() => acompanharOcorrencia(slug, protocolo), [slug, protocolo])
  const { dados: ocorrencia, erro, tentarDeNovo } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!ocorrencia) return <p className="portal-nota">Carregando…</p>

  const r = ocorrencia.resolucao
  // solicitação ainda aberta não tem resolução para mostrar
  if (!r) return <Navigate to={`/portal/${slug}/acompanhar/${ocorrencia.protocolo}`} replace />

  const reenvio = r.tipo === 'Reenvio'

  return (
    <>
      <PageHeader
        eyebrow="Resolvido"
        titulo={reenvio ? 'Sua nova peça está a caminho.' : 'Seu reembolso foi realizado.'}
        subtitulo={reenvio ? 'Registramos o reenvio do seu pedido.' : 'Registramos o reembolso do seu pedido.'}
      />
      <Card>
        <dl className="portal-lista">
          {reenvio ? (
            <>
              <div>
                <dt>Novo código de rastreio</dt>
                <dd>{r.codigoRastreio}</dd>
              </div>
              <div>
                <dt>Item reenviado</dt>
                <dd>{r.itens}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt>Valor reembolsado</dt>
                <dd>{formatarMoeda(r.valor ?? 0)}</dd>
              </div>
              {r.transacao && (
                <div>
                  <dt>ID da transação</dt>
                  <dd>{r.transacao}</dd>
                </div>
              )}
            </>
          )}
          <div>
            <dt>Resolvido em</dt>
            <dd>{formatarData(r.concluidoEm)}</dd>
          </div>
        </dl>
        {reenvio && r.codigoRastreio && (
          <div className="portal-botoes">
            <CopyButton texto={r.codigoRastreio} rotulo="Copiar código de rastreio" />
            <Button variante="secundario" to={linkCorreios(r.codigoRastreio)} externo>
              Acompanhar entrega nos Correios
            </Button>
          </div>
        )}
      </Card>
      <div className="portal-botoes">
        <Button to={`/portal/${slug}/acompanhar/${ocorrencia.protocolo}`}>Ver histórico da solicitação</Button>
        <Button variante="secundario" to={`/portal/${slug}`}>
          Consultar outro pedido
        </Button>
      </div>
    </>
  )
}

export default PortalConcluidoPage
