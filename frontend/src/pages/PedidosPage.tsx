import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button/Button'
import ErroCarregamento from '../components/ErroCarregamento/ErroCarregamento'
import EstadoVazio from '../components/EstadoVazio/EstadoVazio'
import Input from '../components/Input/Input'
import PageHeader from '../components/PageHeader/PageHeader'
import PedidosTable from '../components/PedidosTable/PedidosTable'
import { useDados } from '../hooks/useDados'
import { usePlano } from '../hooks/usePlano'
import { listarPedidos } from '../services/pedidos.service'
import { apenasDigitos } from '../utils/format'
import './pages.css'
import './OcorrenciasPage.css'

const POR_PAGINA = 10

function PedidosPage() {
  const { inclui } = usePlano()
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)
  const { dados: pedidos, erro, tentarDeNovo } = useDados(listarPedidos)

  function atualizar(mudancas: Record<string, string>) {
    const novos = new URLSearchParams(params)
    Object.entries(mudancas).forEach(([k, v]) => (v ? novos.set(k, v) : novos.delete(k)))
    if (!('pagina' in mudancas)) novos.delete('pagina')
    setParams(novos, { replace: true })
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const digitos = apenasDigitos(busca)
    return (pedidos ?? []).filter((p) => {
      if (!termo) return true
      return (
        p.numero.toLowerCase().includes(termo) ||
        p.cliente.nome.toLowerCase().includes(termo) ||
        (digitos.length >= 3 && p.cliente.cpf.includes(digitos))
      )
    })
  }, [pedidos, busca])

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!pedidos) return <p className="carregando">Carregando…</p>

  return (
    <div className="pagina">
      <PageHeader
        eyebrow="PEDIDOS"
        titulo="Os pedidos da sua loja."
        subtitulo="É por eles que o cliente abre uma solicitação. Mantenha a lista atualizada."
        acoes={
          <>
            <Button to="/pedidos/importar" variante="secundario">
              Importar CSV
            </Button>
            <Button to="/pedidos/novo">+ Cadastrar pedido</Button>
          </>
        }
      />

      {pedidos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum pedido ainda"
          texto="Importe um CSV ou cadastre o primeiro pedido. Sem pedidos, o cliente não consegue abrir uma solicitação no portal."
        >
          <div className="vazio-acoes">
            <Button to="/pedidos/importar">Importar CSV</Button>
            <Button to="/pedidos/novo" variante="secundario">
              Cadastrar pedido
            </Button>
          </div>
        </EstadoVazio>
      ) : (
        <>
          <div style={{ maxWidth: 360 }}>
            <Input
              label="Buscar"
              type="search"
              placeholder="Número do pedido, nome ou CPF"
              value={busca}
              onChange={(e) => atualizar({ q: e.target.value })}
            />
          </div>

          {filtrados.length === 0 ? (
            <EstadoVazio titulo="Nenhum pedido encontrado" texto="Confira o número, o nome ou o CPF, ou limpe a busca.">
              <Button variante="secundario" onClick={() => setParams({}, { replace: true })}>
                Limpar busca
              </Button>
            </EstadoVazio>
          ) : (
            <PedidosTable
              pedidos={filtrados}
              pagina={pagina}
              porPagina={POR_PAGINA}
              onPagina={(p) => atualizar({ pagina: p > 1 ? String(p) : '' })}
              destino={(p) => (inclui('ficha_cliente') ? `/clientes/${p.cliente.id}` : `/pedidos/${p.id}`)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default PedidosPage
