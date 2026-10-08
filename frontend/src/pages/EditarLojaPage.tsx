import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert/Alert'
import BackLink from '../components/BackLink/BackLink'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import Input from '../components/Input/Input'
import PageHeader from '../components/PageHeader/PageHeader'
import Textarea from '../components/Textarea/Textarea'
import { useDados } from '../hooks/useDados'
import { useToast } from '../hooks/useToast'
import { buscarLoja, salvarLoja } from '../services/lojas.service'
import { NOMES } from '../utils/planos'
import './pages.css'

interface Campos {
  nome: string
  slug: string
  email: string
  prazo: string
  endereco: string
}

function EditarLojaPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { mostrar } = useToast()
  const carregar = useCallback(() => buscarLoja(Number(id)), [id])
  const { dados: loja, erro, tentarDeNovo } = useDados(carregar)

  // null = ainda não editado; mostra os dados da loja carregada
  const [editado, setEditado] = useState<Campos | null>(null)
  const [erros, setErros] = useState<Partial<Campos & { geral: string }>>({})
  const [salvando, setSalvando] = useState(false)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!loja) return <p className="carregando">Carregando…</p>

  const campos: Campos = editado ?? {
    nome: loja.nome,
    slug: loja.slug,
    email: loja.email,
    prazo: String(loja.prazoRespostaDias),
    endereco: loja.enderecoDevolucao,
  }
  const mudar = (campo: keyof Campos, valor: string) => setEditado({ ...campos, [campo]: valor })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!campos.nome.trim()) novos.nome = 'Informe o nome da loja. É ele que o cliente vê no portal.'
    if (!campos.slug.trim()) novos.slug = 'Informe o endereço do portal, por exemplo mariana-modas.'
    else if (!/^[a-z0-9-]+$/.test(campos.slug)) {
      novos.slug = 'Use só letras minúsculas, números e hífen, sem espaços ou acentos.'
    }
    if (!campos.email.trim()) novos.email = 'Informe o e-mail de atendimento. Os clientes recebem respostas por ele.'
    else if (!/^\S+@\S+\.\S+$/.test(campos.email)) novos.email = 'E-mail inválido. Confira se tem @ e domínio, como nome@loja.com.br.'
    const prazo = Number(campos.prazo)
    if (!Number.isInteger(prazo) || prazo < 1 || prazo > 30) {
      novos.prazo = 'Informe o prazo em dias úteis, de 1 a 30. O cliente vê esse prazo no portal.'
    }
    setErros(novos)
    if (Object.keys(novos).length) return

    setSalvando(true)
    try {
      await salvarLoja(Number(id), {
        nome: campos.nome.trim(),
        slug: campos.slug.trim(),
        email: campos.email.trim(),
        prazoRespostaDias: prazo,
        enderecoDevolucao: campos.endereco.trim(),
      })
      mostrar('Alterações salvas.')
      navigate('/lojas')
    } catch (err) {
      setErros({ geral: (err as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="pagina">
      <BackLink to="/lojas">Minhas lojas</BackLink>
      <PageHeader
        eyebrow="DADOS DA LOJA"
        titulo={`Editar ${loja.nome}`}
        subtitulo="As informações abaixo identificam sua loja e o portal público."
      />
      <form onSubmit={salvar} noValidate>
        <Card>
          <div className="form-coluna">
            <Input label="Nome da loja" obrigatorio value={campos.nome} onChange={(e) => mudar('nome', e.target.value)} erro={erros.nome} />
            <Input label="Slug do portal" obrigatorio value={campos.slug} onChange={(e) => mudar('slug', e.target.value)} erro={erros.slug} />
            <Input
              label="E-mail de atendimento"
              obrigatorio
              type="email"
              value={campos.email}
              onChange={(e) => mudar('email', e.target.value)}
              erro={erros.email}
            />
            <Input
              label="Prazo para responder (dias úteis)"
              obrigatorio
              type="number"
              min={1}
              max={30}
              inputMode="numeric"
              value={campos.prazo}
              onChange={(e) => mudar('prazo', e.target.value)}
              dica="Aparece para o cliente no acompanhamento: “A loja costuma responder em até N dias úteis”."
              erro={erros.prazo}
            />
            <Textarea
              label="Endereço para devolução"
              rows={3}
              value={campos.endereco}
              onChange={(e) => mudar('endereco', e.target.value)}
              placeholder="Nome da loja, rua, número, bairro, cidade/UF e CEP"
            />
            <Alert>
              Portal: postec.app/portal/{campos.slug || loja.slug}
              <br />
              Plano atual: {NOMES[loja.plano]}
            </Alert>
            {erros.geral && (
              <span className="campo-erro" role="alert">
                {erros.geral}
              </span>
            )}
            <div className="form-acoes">
              <Button type="button" variante="secundario" onClick={() => navigate('/lojas')}>
                Cancelar
              </Button>
              <Button type="submit" carregando={salvando}>
                Salvar alterações
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default EditarLojaPage
