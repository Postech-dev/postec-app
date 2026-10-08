import './Paginacao.css'

interface PaginacaoProps {
  pagina: number
  total: number
  porPagina: number
  // "pedido" / "pedidos" para o texto do rodapé
  singular: string
  plural: string
  onPagina: (pagina: number) => void
}

function Paginacao({ pagina, total, porPagina, singular, plural, onPagina }: PaginacaoProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  return (
    <footer className="paginacao">
      <span>
        {total} {total === 1 ? singular : plural} • Página {pagina} de {totalPaginas}
      </span>
      <div className="paginacao-botoes">
        <button type="button" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
          Anterior
        </button>
        <button type="button" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>
          Próxima
        </button>
      </div>
    </footer>
  )
}

export default Paginacao
