import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDados } from '../../hooks/useDados'
import { fichaDoCliente } from '../../services/clientes.service'
import { mascararCpf } from '../../utils/cpf'
import { formatarAbertura, formatarData, formatarMoeda } from '../../utils/format'
import BackLink from '../BackLink/BackLink'
import BotaoPlano from '../BotaoPlano/BotaoPlano'
import CanalBadge from '../CanalBadge/CanalBadge'
import Card from '../Card/Card'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../EstadoVazio/EstadoVazio'
import PageHeader from '../PageHeader/PageHeader'
import StatCard from '../StatCard/StatCard'
import StatusBadge from '../StatusBadge/StatusBadge'
import './FichaCliente.css'

function FichaCliente({ clienteId }: { clienteId: number }) {
  const carregar = useCallback(() => fichaDoCliente(clienteId), [clienteId])
  const { dados, erro, tentarDeNovo } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!dados) return <p>Carregando…</p>

  const { cliente, pedidos, ocorrencias } = dados
  const maisRecente = pedidos[0]
  const bruta = dados.ultimaInteracao
  const ultima = !bruta ? '—' : bruta.includes('T') ? formatarAbertura(bruta) : formatarData(bruta)

  return (
    <>
      <BackLink to="/pedidos">Pedidos</BackLink>
      <PageHeader
        eyebrow="CLIENTE"
        titulo={cliente.nome}
        subtitulo={`${cliente.email} • CPF ${mascararCpf(cliente.cpf)}`}
        acoes={
          maisRecente && (
            <BotaoPlano recurso="crm" to={`/ocorrencias/nova?pedido=${maisRecente.id}`}>
              Abrir contato
            </BotaoPlano>
          )
        }
      />

      <div className="cards-resumo">
        <StatCard titulo="Pedidos" valor={dados.totalPedidos} descricao="Total do cliente" />
        <StatCard titulo="Ocorrências" valor={dados.totalOcorrencias} descricao="Total do cliente" cor="brand" />
        <StatCard
          titulo="Última interação"
          valor={ultima}
          descricao="Pedido ou mensagem mais recente"
        />
      </div>

      <div className="pagina-grid">
        <Card titulo="Pedidos">
          <ul className="lista-simples">
            {pedidos.map((p) => (
              <li key={p.id}>
                <strong>{p.numero}</strong>
                <span className="ficha-grande">
                  {p.produto} • {p.detalhe}
                </span>
                <span>{formatarMoeda(p.valor)}</span>
                <span className="ficha-data">{formatarData(p.dataPedido)}</span>
                <BotaoPlano recurso="crm" to={`/ocorrencias/nova?pedido=${p.id}`} variante="secundario">
                  Abrir contato
                </BotaoPlano>
              </li>
            ))}
          </ul>
        </Card>

        <Card titulo="Ocorrências">
          {ocorrencias.length === 0 ? (
            <EstadoVazio titulo="Nenhuma ocorrência" texto="Este cliente nunca precisou de atendimento. Ótimo sinal." />
          ) : (
            <ul className="lista-simples">
              {ocorrencias.map((o) => (
                <li key={o.id}>
                  <Link to={`/ocorrencias/${o.protocolo}`}>
                    <strong>{o.protocolo}</strong>
                  </Link>
                  <span className="ficha-grande">{o.motivo}</span>
                  <CanalBadge canal={o.canal} />
                  <StatusBadge status={o.status} />
                  <span className="ficha-data">{formatarAbertura(o.abertaEm)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

export default FichaCliente
