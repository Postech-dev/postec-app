import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import Input from '../components/Input/Input'
import PageHeader from '../components/PageHeader/PageHeader'
import { useDados } from '../hooks/useDados'
import { useToast } from '../hooks/useToast'
import { criarAtendente, listarEquipe } from '../services/equipe.service'
import { iniciais } from '../utils/format'
import './pages.css'
import './EquipePage.css'

function EquipePage() {
  const { mostrar } = useToast()
  const { dados: equipe, setDados, erro, tentarDeNovo } = useDados(listarEquipe)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ nome?: string; email?: string; senha?: string }>({})
  const [salvando, setSalvando] = useState(false)

  async function criar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!nome.trim()) novos.nome = 'Informe o nome de quem vai atender.'
    if (!email.trim()) novos.email = 'Informe o e-mail. Ele será o login do atendente.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) novos.email = 'E-mail inválido. Confira se tem @ e domínio, como nome@loja.com.br.'
    if (senha.length < 6) novos.senha = 'Crie uma senha inicial com ao menos 6 caracteres.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setSalvando(true)
    try {
      await criarAtendente({ nome: nome.trim(), email: email.trim(), senha })
      setDados(await listarEquipe())
      mostrar(`${nome.trim()} foi adicionado(a) à equipe.`)
      setNome('')
      setEmail('')
      setSenha('')
    } finally {
      setSalvando(false)
    }
  }

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!equipe) return <p className="carregando">Carregando…</p>

  return (
    <div className="pagina">
      <PageHeader
        eyebrow="ADMINISTRAÇÃO"
        titulo="Quem cuida do seu pós-venda."
        subtitulo="Administradores gerenciam a loja; atendentes acompanham e resolvem ocorrências."
      />

      <div className="pagina-grid">
        <Card titulo="Equipe">
          {equipe.length === 0 ? (
            <EstadoVazio titulo="Ninguém na equipe ainda" texto="Adicione um atendente ao lado para dividir o atendimento." />
          ) : (
            <ul className="equipe-lista">
              {equipe.map((u) => (
                <li key={u.id} className="equipe-item">
                  <span className="avatar" aria-hidden="true">
                    {iniciais(u.nome)}
                  </span>
                  <div className="equipe-dados">
                    <strong>{u.nome}</strong>
                    <span>{u.email}</span>
                  </div>
                  <span className="equipe-papel">{u.papel}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Adicionar atendente">
          <form className="form-coluna" onSubmit={criar} noValidate>
            <Input label="Nome" obrigatorio value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
            <Input
              label="E-mail"
              obrigatorio
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erro={erros.email}
            />
            <Input
              label="Senha inicial"
              obrigatorio
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              erro={erros.senha}
              autoComplete="new-password"
            />
            <Input label="Permissão" value="Atendente" readOnly />
            <Button type="submit" bloco carregando={salvando}>
              Criar usuário
            </Button>
            <p className="equipe-nota">O usuário é criado diretamente pela administradora.</p>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default EquipePage
