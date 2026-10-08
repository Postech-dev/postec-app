import { useCallback } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useDados } from '../../hooks/useDados'
import { buscarLojaPorSlug } from '../../services/lojas.service'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import './PortalShell.css'

function PortalShell() {
  const { slug = '' } = useParams()
  const carregar = useCallback(() => buscarLojaPorSlug(slug), [slug])
  const { dados: loja, erro, tentarDeNovo } = useDados(carregar)

  return (
    <div className="portal-shell">
      <header className="portal-cabecalho">
        <strong className="portal-loja">{loja?.nome ?? 'PosTec'}</strong>
        <span className="portal-sub">Central de pós-venda • por PosTec</span>
      </header>
      <main className="portal-main">
        {erro && <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />}
        {loja && <Outlet context={{ loja }} />}
        {!loja && !erro && <p className="portal-sub">Carregando…</p>}
      </main>
    </div>
  )
}

export default PortalShell
