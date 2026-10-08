import Button from '../Button/Button'
import './ErroCarregamento.css'

interface ErroCarregamentoProps {
  mensagem?: string
  onTentar: () => void
}

function ErroCarregamento({ mensagem, onTentar }: ErroCarregamentoProps) {
  return (
    <div className="erro-carga" role="alert">
      <strong>Não conseguimos carregar esta página.</strong>
      <p>{mensagem || 'Verifique sua conexão e tente de novo.'}</p>
      <Button variante="secundario" onClick={onTentar}>
        Tentar de novo
      </Button>
    </div>
  )
}

export default ErroCarregamento
