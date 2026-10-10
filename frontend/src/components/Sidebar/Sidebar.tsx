import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { usePlano } from '../../hooks/usePlano'
import type { ContagensPainel, Recurso, Usuario } from '../../types'
import { iniciais } from '../../utils/format'
import { NOMES } from '../../utils/planos'
import Logo from '../Logo/Logo'
import PlanosModal from '../PlanosModal/PlanosModal'
import PlanoSwitcher from '../PlanoSwitcher/PlanoSwitcher'
import './Sidebar.css'

interface SidebarProps {
  usuario: Usuario
  contagens: ContagensPainel
  aberta: boolean
  onNavegar: () => void
  onSair: () => void
}

interface Item {
  to: string
  texto: string
  // recurso pago: o item fica visível, com cadeado, quando o plano não inclui
  recurso?: Recurso
}

const links: Item[] = [
  { to: '/ocorrencias', texto: 'Ocorrências' },
  { to: '/pedidos', texto: 'Pedidos' },
  { to: '/metricas', texto: 'Métricas', recurso: 'metricas' },
  { to: '/integracoes', texto: 'Integrações', recurso: 'integracao' },
  { to: '/lojas', texto: 'Minhas lojas' },
  { to: '/equipe', texto: 'Equipe' },
]

function Sidebar({ usuario, contagens, aberta, onNavegar, onSair }: SidebarProps) {
  const { plano, inclui } = usePlano()
  const [planos, setPlanos] = useState(false)

  return (
    <aside id="menu-principal" className={`sidebar ${aberta ? 'sidebar-aberta' : ''}`} aria-label="Menu principal">
      <div className="sidebar-topo">
        <Logo />
        <span className="sidebar-lema">PÓS-VENDA EM ORDEM</span>
      </div>

      <button type="button" className="sidebar-loja" onClick={() => setPlanos(true)}>
        <span className="sidebar-loja-nome">{usuario.lojaNome}</span>
        <span className="sidebar-loja-plano">Plano {NOMES[plano]}</span>
      </button>
      <PlanosModal aberto={planos} onFechar={() => setPlanos(false)} />

      <nav className="sidebar-nav">
        <span className="sidebar-grupo">PRINCIPAL</span>
        {links.map((l) => {
          const bloqueado = l.recurso ? !inclui(l.recurso) : false
          return (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onNavegar}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-ativo' : ''}`}
            >
              {l.texto}
              {bloqueado && (
                <span className="sidebar-cadeado" aria-hidden="true">
                  🔒
                </span>
              )}
              {bloqueado && <span className="so-leitor"> (bloqueado no seu plano)</span>}
              {l.to === '/ocorrencias' && contagens.novas > 0 && (
                <span className="sidebar-contador">
                  {contagens.novas}
                  <span className="so-leitor"> {contagens.novas === 1 ? 'nova ocorrência' : 'novas ocorrências'}</span>
                </span>
              )}
            </NavLink>
          )
        })}
        <a className="sidebar-link" href="/portal/mariana-modas" target="_blank" rel="noreferrer">
          Portal do cliente<span className="so-leitor"> (abre em nova aba)</span>
        </a>
      </nav>

      <div className="sidebar-rodape">
        <PlanoSwitcher />
        <div className="sidebar-dica">
          <strong>Tudo em um só lugar.</strong>
          <span>Cada ocorrência, do início à resolução.</span>
        </div>
        <div className="sidebar-usuario">
          <span className="avatar" aria-hidden="true">
            {iniciais(usuario.nome)}
          </span>
          <div className="sidebar-usuario-dados">
            <strong>{usuario.nome}</strong>
            <span>{usuario.papel}</span>
          </div>
          <button type="button" className="sidebar-sair" onClick={onSair}>
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
