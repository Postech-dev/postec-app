import { useState } from 'react'
import { useDados } from '../../hooks/useDados'
import { useToast } from '../../hooks/useToast'
import { conectarNuvemshop, desconectarNuvemshop, statusNuvemshop } from '../../services/integracoes.service'
import { formatarData } from '../../utils/format'
import Button from '../Button/Button'
import Card from '../Card/Card'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import './IntegracaoNuvemshop.css'

function IntegracaoNuvemshop() {
  const { mostrar } = useToast()
  const { dados: status, setDados, erro, tentarDeNovo } = useDados(statusNuvemshop)
  const [trabalhando, setTrabalhando] = useState(false)

  async function alternar() {
    if (!status) return
    setTrabalhando(true)
    try {
      const novo = status.conectada ? await desconectarNuvemshop() : await conectarNuvemshop()
      setDados(novo)
      mostrar(novo.conectada ? 'Nuvemshop conectada (simulação).' : 'Nuvemshop desconectada.')
    } finally {
      setTrabalhando(false)
    }
  }

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!status) return <p>Carregando…</p>

  return (
    <Card>
      <div className="integracao">
        <div className="integracao-nome" aria-hidden="true">
          N
        </div>
        <div className="integracao-dados">
          <h2 className="card-titulo">Nuvemshop</h2>
          <p>Receba os pedidos da sua loja automaticamente, sem planilha.</p>
          <span className={`integracao-status ${status.conectada ? 'integracao-ligada' : ''}`}>
            {status.conectada ? `Conectada em ${formatarData(status.conectadaEm ?? '')}` : 'Não conectada'}
          </span>
        </div>
        <Button
          variante={status.conectada ? 'secundario' : 'primario'}
          carregando={trabalhando}
          textoCarregando={status.conectada ? 'Desconectando…' : 'Conectando…'}
          onClick={alternar}
        >
          {status.conectada ? 'Desconectar' : 'Conectar'}
        </Button>
      </div>
    </Card>
  )
}

export default IntegracaoNuvemshop
