import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DadosPedido } from '../../types'
import { cpfValido, normalizarCpf } from '../../utils/cpf'
import { lerData } from '../../utils/csv'
import { HOJE, formatarCpf, lerValor, normalizarPedido } from '../../utils/format'
import Button from '../Button/Button'
import Card from '../Card/Card'
import Input from '../Input/Input'
import './PedidoForm.css'

interface PedidoFormProps {
  // lança Error com a mensagem a mostrar (ex.: número já existe)
  onSalvar: (dados: DadosPedido) => Promise<void>
}

type Campos = 'numero' | 'nome' | 'email' | 'cpf' | 'produto' | 'quantidade' | 'valor' | 'data' | 'geral'

function PedidoForm({ onSalvar }: PedidoFormProps) {
  const navigate = useNavigate()
  const [numero, setNumero] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [produto, setProduto] = useState('')
  const [tamanho, setTamanho] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(HOJE)
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({})
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!numero.trim()) novos.numero = 'Informe o número do pedido, como aparece na sua loja (ex.: PED-201).'
    if (!nome.trim()) novos.nome = 'Informe o nome do cliente.'
    if (!/^\S+@\S+\.\S+$/.test(email)) novos.email = 'E-mail inválido. Confira se tem @ e domínio, como nome@email.com.'
    if (!cpfValido(cpf)) novos.cpf = 'CPF inválido. Confira os 11 números; o cliente usa o CPF para consultar o pedido.'
    if (!produto.trim()) novos.produto = 'Informe o produto comprado.'
    const qtd = Number(quantidade)
    if (!Number.isInteger(qtd) || qtd < 1) novos.quantidade = 'Informe uma quantidade inteira, de 1 em diante.'
    const preco = lerValor(valor)
    if (!(preco > 0)) novos.valor = 'Informe o valor do pedido, por exemplo 189,90 ou 1.234,56.'
    const dataIso = lerData(data)
    if (!dataIso) novos.data = 'Informe a data do pedido.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      await onSalvar({
        numero: normalizarPedido(numero),
        clienteNome: nome.trim(),
        clienteEmail: email.trim().toLowerCase(),
        clienteCpf: normalizarCpf(cpf),
        produto: produto.trim(),
        tamanho: tamanho.trim() || undefined,
        quantidade: qtd,
        valor: preco,
        dataPedido: dataIso!,
      })
    } catch (err) {
      setErros({ geral: (err as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Card>
        <div className="pedido-form">
          <Input label="Número do pedido" obrigatorio placeholder="PED-201" value={numero} onChange={(e) => setNumero(e.target.value)} erro={erros.numero} />
          <Input label="Nome do cliente" obrigatorio value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} autoComplete="off" />
          <Input label="E-mail do cliente" obrigatorio type="email" value={email} onChange={(e) => setEmail(e.target.value)} erro={erros.email} autoComplete="off" />
          <Input
            label="CPF do cliente"
            obrigatorio
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            erro={erros.cpf}
            autoComplete="off"
          />
          <Input label="Produto" obrigatorio value={produto} onChange={(e) => setProduto(e.target.value)} erro={erros.produto} />
          <Input label="Tamanho" placeholder="M" value={tamanho} onChange={(e) => setTamanho(e.target.value)} dica="Opcional." />
          <Input
            label="Quantidade"
            obrigatorio
            type="number"
            min={1}
            inputMode="numeric"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            erro={erros.quantidade}
          />
          <Input
            label="Valor (R$)"
            obrigatorio
            placeholder="189,90"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            erro={erros.valor}
          />
          <Input label="Data do pedido" obrigatorio type="date" value={data} onChange={(e) => setData(e.target.value)} erro={erros.data} />
        </div>
        {erros.geral && (
          <span className="campo-erro" role="alert">
            {erros.geral}
          </span>
        )}
        <div className="form-acoes">
          <Button type="button" variante="secundario" onClick={() => navigate('/pedidos')}>
            Cancelar
          </Button>
          <Button type="submit" carregando={enviando}>
            Cadastrar pedido
          </Button>
        </div>
      </Card>
    </form>
  )
}

export default PedidoForm
