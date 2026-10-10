import { useOutletContext } from 'react-router-dom'
import PortalConsulta from '../components/PortalConsulta/PortalConsulta'
import type { PortalContexto } from '../types'
import './PortalConsultaPage.css'

const PASSOS = [
  { n: '1', titulo: 'Consulte o pedido', descricao: 'Informe o número e o CPF usado na compra.' },
  { n: '2', titulo: 'Conte o que aconteceu', descricao: 'Selecione o motivo e descreva o problema.' },
  { n: '3', titulo: 'Acompanhe por e-mail', descricao: 'Você recebe atualizações no e-mail e pode responder pela web.' },
]

function PortalConsultaPage() {
  const { loja } = useOutletContext<PortalContexto>()

  return (
    <div className="consulta-grade">

      {/* coluna esquerda — só aparece no desktop */}
      <div className="consulta-intro">
        <h1 className="consulta-titulo">
          Tudo certo com a sua compra em {loja.nome}?
        </h1>
        <p className="consulta-subtitulo">
          Se recebeu algo errado, com defeito ou quer devolver, você está no lugar certo.
          Resolvemos para você de forma rápida.
        </p>

        <ol className="consulta-passos" aria-label="Como funciona">
          {PASSOS.map((p) => (
            <li key={p.n} className="consulta-passo">
              <span className="consulta-passo-num" aria-hidden="true">{p.n}</span>
              <div>
                <strong className="consulta-passo-titulo">{p.titulo}</strong>
                <p className="consulta-passo-desc">{p.descricao}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* coluna direita — formulários */}
      <div className="consulta-formularios">
        <PortalConsulta />

        {/* "Como funciona" compacto — só no mobile */}
        <details className="consulta-como-mobile">
          <summary>Como funciona?</summary>
          <ol>
            {PASSOS.map((p) => (
              <li key={p.n}>{p.titulo}: {p.descricao}</li>
            ))}
          </ol>
        </details>
      </div>

    </div>
  )
}

export default PortalConsultaPage
