import { useState } from 'react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChartColumn,
  Globe,
  Inbox,
  Lock,
  LogOut,
  Package,
  Plug,
  Store,
  Users,
} from 'lucide-react'
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
  icone: ComponentType<{ size?: number | string; strokeWidth?: number | string; 'aria-hidden'?: boolean }>
  // recurso pago: o item fica visível, com cadeado, quando o plano não inclui
  recurso?: Recurso
}

const links: Item[] = [
  { to: '/ocorrencias', texto: 'Ocorrências', icone: Inbox },
  { to: '/pedidos', texto: 'Pedidos', icone: Package },
  { to: '/metricas', texto: 'Métricas', icone: ChartColumn, recurso: 'metricas' },
  { to: '/integracoes', texto: 'Integrações', icone: Plug, recurso: 'integracao' },
  { to: '/lojas', texto: 'Minhas lojas', icone: Store },
  { to: '/equipe', texto: 'Equipe', icone: Users },
]

function Sidebar({ usuario, contagens, aberta, onNavegar, onSair }: SidebarProps) {
  const { plano, inclui } = usePlano()
  const [planos, setPlanos] = useState(false)

  return (
    <aside id="menu-principal" className={`sidebar ${aberta ? 'sidebar-aberta' : ''}`} aria-label="Menu principal">
      <div className="sidebar-topo">
        <Logo />
        <span className="sidebar-lema">Pós-venda em ordem</span>
      </div>

      <button type="button" className="sidebar-loja" onClick={() => setPlanos(true)}>
        <span className="sidebar-loja-nome">{usuario.lojaNome}</span>
        <span className="sidebar-loja-plano">Plano {NOMES[plano]}</span>
      </button>
      <PlanosModal aberto={planos} onFechar={() => setPlanos(false)} />

      <nav className="sidebar-nav">
        <span className="sidebar-grupo">Operação</span>
        {links.map((l) => {
          const bloqueado = l.recurso ? !inclui(l.recurso) : false
          return (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onNavegar}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-ativo' : ''}`}
            >
              <span className="sidebar-link-icone" aria-hidden="true">
                <l.icone size={17} strokeWidth={1.8} />
              </span>
              {l.texto}
              {bloqueado && (
                <span className="sidebar-cadeado" aria-hidden="true">
                  <Lock size={15} strokeWidth={1.8} />
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
        {usuario.lojaSlug && <a className="sidebar-link" href={`/portal/${encodeURIComponent(usuario.lojaSlug)}`} target="_blank" rel="noreferrer">
          <span className="sidebar-link-icone" aria-hidden="true">
            <Globe size={17} strokeWidth={1.8} />
          </span>
          Portal do cliente<span className="so-leitor"> (abre em nova aba)</span>
        </a>}
      </nav>

      <div className="sidebar-rodape">
        <PlanoSwitcher />
        <div className="sidebar-dica">
          <strong>Do pedido à resolução</strong>
          <span>Acompanhe cada etapa do pós-venda</span>
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
            <LogOut size={14} strokeWidth={1.8} aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
