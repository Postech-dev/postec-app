import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { acompanharOcorrencia, consultarPedido } from '../../services/portal.service'
import { apenasDigitos, formatarCpf, normalizarPedido, normalizarProtocolo } from '../../utils/format'
import Button from '../Button/Button'
import Card from '../Card/Card'
import '../../pages/portal.css'
import './PortalConsulta.css'

// Validação do dígito verificador do CPF
function cpfValido(cpf: string): boolean {
  const d = apenasDigitos(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const soma = (n: number) =>
    d.slice(0, n).split('').reduce((acc, c, i) => acc + Number(c) * (n + 1 - i), 0)
  const dv = (s: number) => { const r = (s * 10) % 11; return r === 10 || r === 11 ? 0 : r }
  return dv(soma(9)) === Number(d[9]) && dv(soma(10)) === Number(d[10])
}

function PortalConsulta() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()

  // — formulário: consultar pedido —
  const [numero, setNumero] = useState('')
  const [cpf, setCpf] = useState('')
  const [erros, setErros] = useState<{ numero?: string; cpf?: string; geral?: string }>({})
  const [consultando, setConsultando] = useState(false)

  // — formulário: acompanhar solicitação —
  const [protocolo, setProtocolo] = useState('')
  const [email, setEmail] = useState('')
  const [errosAcomp, setErrosAcomp] = useState<{ protocolo?: string; email?: string; geral?: string }>({})
  const [buscando, setBuscando] = useState(false)

  // valida CPF ao sair do campo
  function validarCpf() {
    if (!cpf) return
    if (!cpfValido(cpf)) setErros((e) => ({ ...e, cpf: 'CPF inválido. Confira os números.' }))
    else setErros((e) => ({ ...e, cpf: undefined }))
  }

  async function consultar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!numero.trim()) novos.numero = 'Digite o número do pedido.'
    const digitos = apenasDigitos(cpf)
    if (digitos.length !== 11) novos.cpf = 'Digite os 11 números do CPF usado na compra.'
    else if (!cpfValido(cpf)) novos.cpf = 'CPF inválido. Confira os números.'
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
    const novos: typeof errosAcomp = {}
    if (!protocolo.trim()) novos.protocolo = 'Digite o protocolo que chegou no seu e-mail (ex.: POS-1001).'
    if (!email.trim()) novos.email = 'Digite o e-mail usado na abertura da solicitação.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) novos.email = 'E-mail inválido.'
    setErrosAcomp(novos)
    if (Object.keys(novos).length) return

    setBuscando(true)
    try {
      const o = await acompanharOcorrencia(slug, protocolo, email.trim())
      navigate(`/portal/${slug}/acompanhar/${o.protocolo}`)
    } catch (err) {
      // mesma mensagem para protocolo errado ou e-mail errado (não vazar qual existe)
      setErrosAcomp({ geral: 'Não encontramos uma solicitação com esses dados. Confira o protocolo e o e-mail que chegou no seu e-mail de confirmação.' })
    } finally {
      setBuscando(false)
    }
  }

  // Enter no input dispara submit do formulário pai
  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') (e.currentTarget.closest('form') as HTMLFormElement | null)?.requestSubmit()
  }

  return (
    <>
      {/* card principal: consultar pedido */}
      <Card>
        <form className="pc-bloco" onSubmit={consultar} noValidate>
          <h2 className="pc-card-titulo">Consultar pedido</h2>

          <div className="pc-campo">
            <label htmlFor="pc-numero" className="pc-label">
              Número do pedido <span className="pc-obrig" aria-hidden="true">*</span>
            </label>
            <input
              id="pc-numero"
              type="text"
              className={`pc-input ${erros.numero ? 'pc-input-erro' : ''}`}
              placeholder="PED-101"
              autoCapitalize="characters"
              autoComplete="off"
              value={numero}
              onChange={(e) => { setNumero(e.target.value); setErros((v) => ({ ...v, numero: undefined, geral: undefined })) }}
              onBlur={() => numero.trim() && setNumero(normalizarPedido(numero))}
              onKeyDown={aoTeclar}
              aria-describedby={erros.numero ? 'pc-numero-erro' : 'pc-numero-ajuda'}
              aria-invalid={!!erros.numero}
              aria-required="true"
            />
            {erros.numero
              ? <span id="pc-numero-erro" className="pc-erro" role="alert">{erros.numero}</span>
              : (
                <details className="pc-disclosure" id="pc-numero-ajuda">
                  <summary>Onde encontro o número do pedido?</summary>
                  <p>Está no e-mail de confirmação da compra (começa com PED-). Exemplo: <strong>PED-101</strong></p>
                </details>
              )
            }
          </div>

          <div className="pc-campo">
            <label htmlFor="pc-cpf" className="pc-label">
              CPF <span className="pc-obrig" aria-hidden="true">*</span>
            </label>
            <input
              id="pc-cpf"
              type="text"
              inputMode="numeric"
              className={`pc-input ${erros.cpf ? 'pc-input-erro' : ''}`}
              placeholder="000.000.000-00"
              autoComplete="off"
              value={cpf}
              onChange={(e) => { setCpf(formatarCpf(e.target.value)); setErros((v) => ({ ...v, cpf: undefined, geral: undefined })) }}
              onBlur={validarCpf}
              onKeyDown={aoTeclar}
              aria-describedby={erros.cpf ? 'pc-cpf-erro' : 'pc-cpf-dica'}
              aria-invalid={!!erros.cpf}
              aria-required="true"
            />
            {erros.cpf
              ? <span id="pc-cpf-erro" className="pc-erro" role="alert">{erros.cpf}</span>
              : <span id="pc-cpf-dica" className="pc-nota">Usamos só para confirmar que o pedido é seu.</span>
            }
          </div>

          {erros.geral && (
            <div className="pc-erro-geral" role="alert" aria-live="assertive">
              <strong>{erros.geral}</strong>
              <span>Veja se o número está igual ao do e-mail da compra. Se continuar sem achar, fale com a loja pelo e-mail de atendimento.</span>
            </div>
          )}

          <Button type="submit" bloco carregando={consultando} textoCarregando="Consultando…">
            Consultar pedido
          </Button>
        </form>
      </Card>

      {/* card secundário: acompanhar solicitação já aberta */}
      <Card titulo="Já abriu uma solicitação?">
        <form className="pc-bloco" onSubmit={acompanhar} noValidate>
          <div className="pc-campo">
            <label htmlFor="pc-protocolo" className="pc-label">
              Protocolo <span className="pc-obrig" aria-hidden="true">*</span>
            </label>
            <input
              id="pc-protocolo"
              type="text"
              className={`pc-input ${errosAcomp.protocolo ? 'pc-input-erro' : ''}`}
              placeholder="POS-1001"
              autoCapitalize="characters"
              autoComplete="off"
              value={protocolo}
              onChange={(e) => { setProtocolo(e.target.value); setErrosAcomp((v) => ({ ...v, protocolo: undefined, geral: undefined })) }}
              onBlur={() => protocolo.trim() && setProtocolo(normalizarProtocolo(protocolo))}
              onKeyDown={aoTeclar}
              aria-describedby={errosAcomp.protocolo ? 'pc-prot-erro' : 'pc-prot-dica'}
              aria-invalid={!!errosAcomp.protocolo}
              aria-required="true"
            />
            {errosAcomp.protocolo
              ? <span id="pc-prot-erro" className="pc-erro" role="alert">{errosAcomp.protocolo}</span>
              : <span id="pc-prot-dica" className="pc-nota">Enviamos quando você abriu a solicitação (ex.: POS-1001).</span>
            }
          </div>

          <div className="pc-campo">
            <label htmlFor="pc-email" className="pc-label">
              E-mail usado na solicitação <span className="pc-obrig" aria-hidden="true">*</span>
            </label>
            <input
              id="pc-email"
              type="email"
              inputMode="email"
              className={`pc-input ${errosAcomp.email ? 'pc-input-erro' : ''}`}
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrosAcomp((v) => ({ ...v, email: undefined, geral: undefined })) }}
              onKeyDown={aoTeclar}
              aria-describedby={errosAcomp.email ? 'pc-email-erro' : undefined}
              aria-invalid={!!errosAcomp.email}
              aria-required="true"
            />
            {errosAcomp.email && <span id="pc-email-erro" className="pc-erro" role="alert">{errosAcomp.email}</span>}
          </div>

          {errosAcomp.geral && (
            <div className="pc-erro-geral" role="alert" aria-live="assertive">
              <strong>{errosAcomp.geral}</strong>
            </div>
          )}

          <Button type="submit" variante="secundario" bloco carregando={buscando} textoCarregando="Buscando…">
            Acompanhar solicitação
          </Button>
        </form>
      </Card>
    </>
  )
}

export default PortalConsulta
