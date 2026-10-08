import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import AcompanhamentoCaso from '../components/AcompanhamentoCaso/AcompanhamentoCaso'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import { useDados } from '../hooks/useDados'
import { acompanharOcorrencia } from '../services/portal.service'
import './portal.css'

function PortalAcompanhamentoPage() {
  const { slug = '', protocolo = '' } = useParams()
  const carregar = useCallback(() => acompanharOcorrencia(slug, protocolo), [slug, protocolo])
  const { dados: ocorrencia, setDados, erro, tentarDeNovo } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!ocorrencia) return <p className="portal-nota">Carregando…</p>

  return (
    <AcompanhamentoCaso
      ocorrencia={ocorrencia}
      slug={slug}
      onAtualizar={async () => setDados(await acompanharOcorrencia(slug, protocolo))}
    />
  )
}

export default PortalAcompanhamentoPage
