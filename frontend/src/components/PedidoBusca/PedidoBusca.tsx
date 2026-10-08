import { useEffect, useState } from 'react'
import { buscarPedidos } from '../../services/pedidos.service'
import type { Pedido } from '../../types'
import { mascararCpf } from '../../utils/cpf'
import { formatarMoeda } from '../../utils/format'
import Input from '../Input/Input'
import './PedidoBusca.css'

interface PedidoBuscaProps {
  onSelecionar: (pedido: Pedido) => void
}

// busca por número, nome ou CPF; a lista aparece a partir de 2 caracteres
function PedidoBusca({ onSelecionar }: PedidoBuscaProps) {
  const [termo, setTermo] = useState('')
  const [achados, setAchados] = useState<Pedido[]>([])
  const pronto = termo.trim().length >= 2

  useEffect(() => {
    if (!pronto) return
    let ativo = true
    // pequena espera para não buscar a cada tecla
    const espera = setTimeout(() => {
      buscarPedidos(termo).then((r) => ativo && setAchados(r))
    }, 200)
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [termo, pronto])

  return (
    <div className="pedido-busca">
      <Input
        label="Buscar pedido"
        type="search"
        placeholder="Número do pedido, nome ou CPF do cliente"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        autoComplete="off"
        dica="Digite pelo menos 2 caracteres."
      />
      <div aria-live="polite">
        {pronto && (
          <p className="pedido-busca-total">
            {achados.length === 0
              ? 'Nenhum pedido encontrado. Confira o número, o nome ou o CPF, ou cadastre o pedido antes.'
              : `${achados.length} ${achados.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}`}
          </p>
        )}
      </div>
      {pronto && achados.length > 0 && (
        <ul className="pedido-busca-lista">
          {achados.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onSelecionar(p)}>
                <strong>{p.numero}</strong>
                <span>
                  {p.cliente.nome} • {mascararCpf(p.cliente.cpf)}
                </span>
                <span className="pedido-busca-sub">
                  {p.produto} • {formatarMoeda(p.valor)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PedidoBusca
