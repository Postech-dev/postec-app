import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import AcompanhamentoCaso from '../components/AcompanhamentoCaso/AcompanhamentoCaso'
import Alert from '../components/Alert/Alert'
import PageHeader from '../components/PageHeader/PageHeader'
import PortalConsulta from '../components/PortalConsulta/PortalConsulta'
import { useDados } from '../hooks/useDados'
import { acompanharPorToken } from '../services/portal.service'
import './portal.css'

// link do e-mail: abre o caso direto, sem pedir protocolo e CPF
function PortalCasoPage() {
  const { slug = '', token = '' } = useParams()
  const carregar = useCallback(() => acompanharPorToken(slug, token), [slug, token])
  const { dados: ocorrencia, setDados, erro } = useDados(carregar)

  // link inválido ou vencido: explica e oferece a consulta normal
  if (erro) {
    return (
      <>
        <PageHeader titulo="Não foi possível abrir este link." />
        <div role="alert">
          <Alert>{erro}</Alert>
        </div>
        <PortalConsulta />
      </>
    )
  }
  if (!ocorrencia) return <p className="portal-nota">Carregando…</p>

  return (
    <AcompanhamentoCaso
      ocorrencia={ocorrencia}
      slug={slug}
      onAtualizar={async () => setDados(await acompanharPorToken(slug, token))}
    />
  )
}

export default PortalCasoPage
