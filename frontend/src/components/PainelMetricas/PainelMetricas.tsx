import { useDados } from '../../hooks/useDados'
import { obterMetricas } from '../../services/metricas.service'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import GraficoBarras from '../GraficoBarras/GraficoBarras'
import StatCard from '../StatCard/StatCard'
import './PainelMetricas.css'

// "4h 3min", "25 min"
function formatarDuracao(minutos: number | null): string {
  if (minutos === null) return '—'
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)}h ${minutos % 60}min`
}

function PainelMetricas() {
  const { dados, erro, tentarDeNovo } = useDados(obterMetricas)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!dados) return <p>Carregando…</p>

  return (
    <>
      <div className="cards-resumo">
        <StatCard titulo="Ocorrências abertas" valor={dados.abertas} descricao="Em andamento agora" cor="brand" />
        <StatCard
          titulo="Tempo até a 1ª resposta"
          valor={formatarDuracao(dados.tempoMedioPrimeiraResposta)}
          descricao="Média dos casos abertos pelo cliente"
          cor="blue"
        />
        <StatCard titulo="Taxa de resolução" valor={`${dados.taxaResolucao}%`} descricao="Concluídas / total" cor="green" />
      </div>
      <div className="metricas-graficos">
        <GraficoBarras titulo="Ocorrências por motivo" itens={dados.porMotivo} />
        <GraficoBarras titulo="Ocorrências por canal de origem" itens={dados.porCanal} />
      </div>
    </>
  )
}

export default PainelMetricas
