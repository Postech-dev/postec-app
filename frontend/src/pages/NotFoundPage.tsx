import Button from '../components/Button/Button'
import Logo from '../components/Logo/Logo'
import { usuarioLogado } from '../services/auth.service'
import './NotFoundPage.css'

function NotFoundPage() {
  const destino = usuarioLogado() ? '/ocorrencias' : '/login'

  return (
    <main className="nao-encontrada">
      <Logo />
      <h1>Página não encontrada</h1>
      <p>O endereço pode estar errado ou a página mudou de lugar. Volte ao início e continue de lá.</p>
      <Button to={destino}>{destino === '/login' ? 'Ir para o login' : 'Ir para as ocorrências'}</Button>
    </main>
  )
}

export default NotFoundPage
