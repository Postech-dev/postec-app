import './StatCard.css'

interface StatCardProps {
  titulo: string
  valor: number | string
  descricao?: string
  cor?: 'brand' | 'blue' | 'green' | 'ink'
  onClick?: () => void
  ativo?: boolean
}

function StatCard({ titulo, valor, descricao, cor = 'ink', onClick, ativo }: StatCardProps) {
  const conteudo = (
    <>
      <strong className={`stat-valor stat-${cor}`}>{valor}</strong>
      <span className="stat-titulo">{titulo}</span>
    </>
  )

  if (!onClick)
    return (
      <div className="stat-card" title={descricao}>
        {conteudo}
      </div>
    )

  return (
    <button
      type="button"
      className={`stat-card stat-botao ${ativo ? 'stat-ativo' : ''}`}
      onClick={onClick}
      aria-pressed={ativo}
      title={descricao}
    >
      {conteudo}
    </button>
  )
}

export default StatCard
