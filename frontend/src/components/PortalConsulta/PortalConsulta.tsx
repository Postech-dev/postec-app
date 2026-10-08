import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { acompanharOcorrencia, consultarPedido } from '../../services/portal.service'
import { formatarCpf, normalizarPedido } from '../../utils/format'
import AjudaExpansivel from '../AjudaExpansivel/AjudaExpansivel'
import Button from '../Button/Button'
import Card from '../Card/Card'
import Input from '../Input/Input'
import '../../pages/portal.css'

// os dois formulários de entrada do portal: consultar a compra ou acompanhar pelo protocolo
function PortalConsulta() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [numero, setNumero] = useState('')
  const [cpf, setCpf] = useState('')
  const [erros, setErros] = useState<{ numero?: string; cpf?: string; geral?: string }>({})
  const [consultando, setConsultando] = useState(false)

  const [protocolo, setProtocolo] = useState('')
  const [erroProtocolo, setErroProtocolo] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function consultar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!numero.trim()) novos.numero = 'Digite o número do pedido.'
    if (cpf.replace(/\D/g, '').length !== 11) novos.cpf = 'Digite os 11 números do CPF usado na compra.'
    setErros(novos)
    if (Object.keys(novos).length) return

    setConsultando(true)
    try {
      const pedido = await consultarPedido(slug, numero, cpf)
      navigate(`/portal/${slug}/pedido`, { state: { pedido } })
    } catch (err) {
      setErros({ geral: (err as Error).message })
    } finally {
      setConsultando(false)
    }
  }

  async function acompanhar(e: FormEvent) {
    e.preventDefault()
    if (!protocolo.trim()) {
      setErroProtocolo('Digite o protocolo que chegou no seu e-mail, por exemplo POS-1001.')
      return
    }
    setBuscando(true)
    try {
      const o = await acompanharOcorrencia(slug, protocolo)
      navigate(`/portal/${slug}/acompanhar/${o.protocolo}`)
    } catch (err) {
      setErroProtocolo((err as Error).message)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <>
      <Card>
        <form className="portal-bloco" onSubmit={consultar} noValidate>
          <div>
            <Input
              label="Número do pedido"
              obrigatorio
              placeholder="PED-101"
              autoCapitalize="characters"
              autoComplete="off"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              // ajusta "ped 101" para "PED-101" ao sair do campo
              onBlur={() => numero.trim() && setNumero(normalizarPedido(numero))}
              erro={erros.numero}
            />
            <AjudaExpansivel pergunta="Onde encontro o número do pedido?">
              Ele está no e-mail de confirmação da compra ou na nota fiscal.
            </AjudaExpansivel>
          </div>
          <div className="portal-bloco" style={{ gap: 8 }}>
            <Input
              label="CPF"
              obrigatorio
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              erro={erros.cpf}
            />
            <p className="portal-nota">
              Pedimos o CPF só para confirmar que o pedido é seu. Ele não é compartilhado.
            </p>
          </div>
          {erros.geral && (
            <div className="portal-erro-consulta" role="alert">
              <strong>{erros.geral}</strong>
              <span>
                Veja se o número está igual ao do e-mail da compra. Se continuar sem achar, fale com a loja pelo
                e-mail de atendimento.
              </span>
            </div>
          )}
          <Button type="submit" bloco carregando={consultando} textoCarregando="Consultando…">
            Consultar pedido
          </Button>
        </form>
      </Card>

      <Card titulo="Já abriu uma solicitação?">
        <form className="portal-bloco" onSubmit={acompanhar} noValidate>
          <Input
            label="Protocolo"
            placeholder="POS-1001"
            autoCapitalize="characters"
            autoComplete="off"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            dica="Enviamos o protocolo por e-mail quando você abriu a solicitação."
            erro={erroProtocolo}
          />
          <Button type="submit" variante="secundario" bloco carregando={buscando} textoCarregando="Buscando…">
            Acompanhar solicitação
          </Button>
        </form>
      </Card>
    </>
  )
}

export default PortalConsulta
