import { useState } from 'react'
import Button from '../components/Button/Button'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import ExcluirLojaModal from '../components/ExcluirLojaModal/ExcluirLojaModal'
import LojaCard from '../components/LojaCard/LojaCard'
import PageHeader from '../components/PageHeader/PageHeader'
import { useDados } from '../hooks/useDados'
import { useToast } from '../hooks/useToast'
import { excluirLoja, listarLojas } from '../services/lojas.service'
import { contarAbertas } from '../services/ocorrencias.service'
import type { Loja } from '../types'
import './pages.css'
import './LojasPage.css'

function LojasPage() {
  const { mostrar } = useToast()
  const { dados: lojas, erro, tentarDeNovo } = useDados(listarLojas)
  const [alvo, setAlvo] = useState<Loja | null>(null)
  const [abertas, setAbertas] = useState(0)
  const [excluindo, setExcluindo] = useState(false)

  async function pedirExclusao(loja: Loja) {
    setAbertas(await contarAbertas(loja.id))
    setAlvo(loja)
  }

  async function confirmarExclusao() {
    if (!alvo) return
    setExcluindo(true)
    try {
      // por enquanto só fecha a confirmação; nada é apagado
      await excluirLoja(alvo.id)
      setAlvo(null)
      mostrar('Pedido de exclusão registrado. Nenhuma loja foi apagada nesta versão.')
    } finally {
      setExcluindo(false)
    }
  }

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!lojas) return <p className="carregando">Carregando…</p>

  return (
    <div className="pagina">
      <PageHeader
        eyebrow="ADMINISTRAÇÃO"
        titulo="Minhas lojas"
        subtitulo="Gerencie os dados e o portal de atendimento de cada loja."
        acoes={<Button>+ Cadastrar loja</Button>}
      />

      {lojas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma loja cadastrada" texto="Cadastre sua primeira loja para liberar o portal de atendimento aos clientes." />
      ) : (
        <div className="lojas-grid">
          {lojas.map((l) => (
            <LojaCard key={l.id} loja={l} onExcluir={() => pedirExclusao(l)} />
          ))}
        </div>
      )}

      <ExcluirLojaModal
        loja={alvo}
        abertas={abertas}
        carregando={excluindo}
        onFechar={() => setAlvo(null)}
        onConfirmar={confirmarExclusao}
      />
    </div>
  )
}

export default LojasPage
