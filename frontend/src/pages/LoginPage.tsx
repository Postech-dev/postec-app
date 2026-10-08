import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout/AuthLayout'
import Button from '../components/Button/Button'
import Input from '../components/Input/Input'
import { login } from '../services/auth.service'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ email?: string; senha?: string; geral?: string }>({})
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!email.trim()) novos.email = 'Digite o e-mail que você usou no cadastro.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) novos.email = 'E-mail inválido. Confira se tem @ e domínio, como nome@loja.com.br.'
    if (!senha.trim()) novos.senha = 'Digite sua senha para entrar.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      await login(email, senha)
      navigate('/ocorrencias')
    } catch (err) {
      setErros({ geral: (err as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Bem-vindo!" subtitulo="Acesse sua conta">
      <form className="form-coluna" onSubmit={enviar} noValidate style={{ gap: 12 }}>
        <Input
          label="Email"
          type="email"
          placeholder="Insira seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
          autoComplete="email"
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Insira sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
          autoComplete="current-password"
        />
        {erros.geral && (
          <span className="campo-erro" role="alert">
            {erros.geral}
          </span>
        )}
        <Button type="submit" bloco carregando={enviando} textoCarregando="Entrando…">
          Entrar
        </Button>
      </form>
      <div className="auth-links">
        <a href="#" onClick={(e) => e.preventDefault()}>
          Esqueci minha senha
        </a>
        <Link to="/cadastro">Cadastrar-se</Link>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
