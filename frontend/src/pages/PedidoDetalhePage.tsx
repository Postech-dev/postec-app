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
import { buscarPedido, ocorrenciasDoPedido } from '../services/pedidos.service'
import { mascararCpf } from '../utils/cpf'
import { formatarData, formatarMoeda } from '../utils/format'
import './pages.css'

const STATUS_EXTERNOS: Record<string, string> = {
  open: 'Aberto', closed: 'Arquivado', cancelled: 'Cancelado', pending: 'Pendente',
  authorized: 'Autorizado', paid: 'Pago', partially_paid: 'Parcialmente pago', abandoned: 'Abandonado',
  refunded: 'Reembolsado', partially_refunded: 'Parcialmente reembolsado', voided: 'Anulado',
  unpacked: 'Aguardando preparo', packed: 'Embalado', shipped: 'Enviado', fulfilled: 'Enviado',
  unshipped: 'Aguardando envio', unfulfilled: 'Aguardando envio', delivered: 'Entregue',
  partially_packed: 'Parcialmente embalado', partially_fulfilled: 'Parcialmente enviado', in_preparation: 'Em preparação',
}
const statusExterno = (valor?: string) => valor ? STATUS_EXTERNOS[valor] || valor : 'Não informado'

// detalhe simples do pedido, usado nos planos sem ficha do cliente
function PedidoDetalhePage() {
  const { id = '' } = useParams()
  const carregar = useCallback(async () => {
    const pedido = await buscarPedido(Number(id))
    return { pedido, ocorrencias: await ocorrenciasDoPedido(pedido.id) }
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
        {p.itens && p.itens.length > 0 && <Card titulo="Itens do pedido">
          <ul className="lista-simples">{p.itens.map(item => <li key={item.id}>
            <strong>{item.produto}</strong>
            {item.variacao && <span>{item.variacao}</span>}
            {item.sku && <span>SKU: {item.sku}</span>}
            <span>{item.quantidade} × {formatarMoeda(item.valorUnitario, p.moeda)}</span>
          </li>)}</ul>
        </Card>}
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
              <dd>{p.cliente.email || 'Não informado'}</dd>
            </div>
            <div>
              <dt>CPF</dt>
              <dd>{p.cliente.cpf ? mascararCpf(p.cliente.cpf) : 'Não informado'}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{formatarMoeda(p.valor, p.moeda)}</dd>
            </div>
            {p.origem === 'nuvemshop' && <>
              <div><dt>Origem</dt><dd>Nuvemshop</dd></div>
              <div><dt>Pedido na Nuvemshop</dt><dd>{statusExterno(p.statusPedido)}</dd></div>
              <div><dt>Pagamento na Nuvemshop</dt><dd>{statusExterno(p.statusPagamento)}</dd></div>
              <div><dt>Envio na Nuvemshop</dt><dd>{statusExterno(p.statusEnvio)}</dd></div>
            </>}
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
