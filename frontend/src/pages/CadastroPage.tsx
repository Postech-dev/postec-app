import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout/AuthLayout'
import Button from '../components/Button/Button'
import Input from '../components/Input/Input'
import { cadastrar } from '../services/auth.service'

interface Erros {
  nome?: string
  loja?: string
  email?: string
  senha?: string
  confirmacao?: string
  geral?: string
}

function CadastroPage() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [loja, setLoja] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: Erros = {}
    if (!nome.trim()) novos.nome = 'Digite seu nome para identificar você na equipe.'
    if (!loja.trim()) novos.loja = 'Digite o nome da loja. É o que o cliente vê no portal.'
    if (!email.trim()) novos.email = 'Digite seu e-mail. Ele será o seu login.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) novos.email = 'E-mail inválido. Confira se tem @ e domínio, como nome@loja.com.br.'
    if (senha.length < 6) novos.senha = 'Crie uma senha com pelo menos 6 caracteres.'
    if (confirmacao !== senha) novos.confirmacao = 'As senhas são diferentes. Digite a mesma senha nos dois campos.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      await cadastrar({ nome: nome.trim(), loja: loja.trim(), email: email.trim(), senha })
      navigate('/ocorrencias')
    } catch (err) {
      setErros({ geral: (err as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Crie sua conta" subtitulo="Cadastre sua loja no PosTec">
      <form className="form-coluna" onSubmit={enviar} noValidate style={{ gap: 12 }}>
        <Input
          label="Seu nome"
          placeholder="Insira seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erros.nome}
          autoComplete="name"
        />
        <Input
          label="Nome da loja"
          placeholder="Insira o nome da loja"
          value={loja}
          onChange={(e) => setLoja(e.target.value)}
          erro={erros.loja}
        />
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
          placeholder="Crie uma senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
          autoComplete="new-password"
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Repita a senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          erro={erros.confirmacao}
          autoComplete="new-password"
        />
        {erros.geral && (
          <span className="campo-erro" role="alert">
            {erros.geral}
          </span>
        )}
        <Button type="submit" bloco carregando={enviando} textoCarregando="Cadastrando…">
          Cadastrar
        </Button>
      </form>
      <div className="auth-links">
        <Link to="/login">Já tenho conta</Link>
      </div>
    </AuthLayout>
  )
}

export default CadastroPage
