import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout, usuarioLogado } from '../../services/auth.service'
import { contagensPainel } from '../../services/ocorrencias.service'
import type { ContagensPainel } from '../../types'
import Sidebar from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import './AppShell.css'

function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const [contagens, setContagens] = useState<ContagensPainel>({ novas: 0, naoLidas: 0 })
  const usuario = usuarioLogado()

  // atualiza os contadores a cada troca de tela
  useEffect(() => {
    contagensPainel().then(setContagens)
  }, [pathname])

  // menu aberto no celular: esc fecha e a página atrás não rola
  useEffect(() => {
    if (!menuAberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false)
    document.addEventListener('keydown', fechar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', fechar)
      document.body.style.overflow = ''
    }
  }, [menuAberto])

  // sem sessão, volta para o login
  if (!usuario) return <Navigate to="/login" replace />

  function sair() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <a href="#conteudo" className="pular-conteudo">
        Pular para o conteúdo
      </a>
      <Sidebar
        usuario={usuario}
        contagens={contagens}
        aberta={menuAberto}
        onNavegar={() => setMenuAberto(false)}
        onSair={sair}
      />
      {menuAberto && <div className="app-shell-fundo" onClick={() => setMenuAberto(false)} aria-hidden="true" />}
      <div className="app-shell-conteudo">
        <Topbar usuario={usuario} menuAberto={menuAberto} onMenu={() => setMenuAberto((v) => !v)} />
        <main id="conteudo" className="app-shell-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
