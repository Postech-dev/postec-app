import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink/BackLink'
import BotaoPlano from '../components/BotaoPlano/BotaoPlano'
import Card from '../components/Card/Card'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import PageHeader from '../components/PageHeader/PageHeader'
import StatusBadge from '../components/StatusBadge/StatusBadge'
import { useDados } from '../hooks/useDados'
import { listarOcorrencias } from '../services/ocorrencias.service'
import { buscarPedido } from '../services/pedidos.service'
import { mascararCpf } from '../utils/cpf'
import { formatarData, formatarMoeda } from '../utils/format'
import './pages.css'

// detalhe simples do pedido, usado nos planos sem ficha do cliente
function PedidoDetalhePage() {
  const { id = '' } = useParams()
  const carregar = useCallback(async () => {
    const pedido = await buscarPedido(Number(id))
    const todas = await listarOcorrencias()
    return { pedido, ocorrencias: todas.filter((o) => o.pedido.numero === pedido.numero) }
  }, [id])
  const { dados, erro, tentarDeNovo } = useDados(carregar)

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!dados) return <p className="carregando">Carregando…</p>

  const { pedido: p, ocorrencias } = dados

  return (
    <div className="pagina">
      <BackLink to="/pedidos">Pedidos</BackLink>
      <PageHeader
        eyebrow="PEDIDO"
        titulo={p.numero}
        subtitulo={`${p.produto} • ${p.detalhe}`}
        acoes={
          <BotaoPlano recurso="crm" to={`/ocorrencias/nova?pedido=${p.id}`}>
            Abrir contato
          </BotaoPlano>
        }
      />

      <div className="pagina-grid">
        <Card titulo="Ocorrências deste pedido">
          {ocorrencias.length === 0 ? (
            <EstadoVazio titulo="Nenhuma ocorrência" texto="Este pedido ainda não teve nenhum problema registrado." />
          ) : (
            <ul className="lista-simples">
              {ocorrencias.map((o) => (
                <li key={o.id}>
                  <Link to={`/ocorrencias/${o.protocolo}`}>
                    <strong>{o.protocolo}</strong>
                  </Link>
                  <span>{o.motivo}</span>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Dados do pedido">
          <dl className="revisao">
            <div>
              <dt>Cliente</dt>
              <dd>{p.cliente.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{p.cliente.email}</dd>
            </div>
            <div>
              <dt>CPF</dt>
              <dd>{mascararCpf(p.cliente.cpf)}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{formatarMoeda(p.valor)}</dd>
            </div>
            <div>
              <dt>Data do pedido</dt>
              <dd>{formatarData(p.dataPedido)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}

export default PedidoDetalhePage
