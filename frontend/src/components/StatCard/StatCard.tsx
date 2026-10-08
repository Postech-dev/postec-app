import './StatCard.css'

interface StatCardProps {
  titulo: string
  valor: number | string
  descricao: string
  cor?: 'brand' | 'blue' | 'green' | 'ink'
  // com onClick, o card vira um filtro
  onClick?: () => void
  ativo?: boolean
}

function StatCard({ titulo, valor, descricao, cor = 'ink', onClick, ativo }: StatCardProps) {
  const conteudo = (
    <>
      <span className="stat-titulo">{titulo}</span>
      <strong className={`stat-valor stat-${cor}`}>{valor}</strong>
      <span className="stat-descricao">{descricao}</span>
    </>
  )

  if (!onClick) return <div className="stat-card">{conteudo}</div>

  return (
    <button
      type="button"
      className={`stat-card stat-botao ${ativo ? 'stat-ativo' : ''}`}
      onClick={onClick}
      aria-pressed={ativo}
    >
      {conteudo}
    </button>
  )
}

export default StatCard
