import { useState } from 'react'
import type { Loja } from '../../types'
import Button from '../Button/Button'
import Input from '../Input/Input'
import Modal from '../Modal/Modal'
import './ExcluirLojaModal.css'

interface ExcluirLojaModalProps {
  loja: Loja | null
  abertas: number
  carregando: boolean
  onFechar: () => void
  onConfirmar: () => void
}

function ExcluirLojaModal({ loja, abertas, carregando, onFechar, onConfirmar }: ExcluirLojaModalProps) {
  // o campo só existe com o modal aberto; ao fechar ele zera
  return (
    <Modal
      aberto={!!loja}
      onFechar={onFechar}
      eyebrow="Confirmação"
      titulo="Excluir loja?"
    >
      {loja && <Conteudo key={loja.id} loja={loja} abertas={abertas} carregando={carregando} onFechar={onFechar} onConfirmar={onConfirmar} />}
    </Modal>
  )
}

function Conteudo({ loja, abertas, carregando, onFechar, onConfirmar }: Omit<ExcluirLojaModalProps, 'loja'> & { loja: Loja }) {
  const [digitado, setDigitado] = useState('')
  const confere = digitado.trim().toLowerCase() === loja.nome.toLowerCase()

  return (
    <>
      <p>Confira os dados da loja antes de continuar. Esta ação precisa ser confirmada por um administrador.</p>
      {abertas > 0 && (
        <p className="excluir-aviso" role="alert">
          Esta loja tem {abertas} {abertas === 1 ? 'ocorrência aberta' : 'ocorrências abertas'}. Elas deixarão de ser
          atendidas se você excluir.
        </p>
      )}
      <Input
        label={`Digite "${loja.nome}" para confirmar`}
        value={digitado}
        onChange={(e) => setDigitado(e.target.value)}
        autoComplete="off"
      />
      <div className="modal-acoes">
        <Button variante="secundario" onClick={onFechar}>
          Cancelar
        </Button>
        <Button
          variante="perigo"
          carregando={carregando}
          onClick={onConfirmar}
          motivoDesabilitado={confere ? undefined : 'Digite o nome da loja para liberar'}
        >
          Confirmar exclusão
        </Button>
      </div>
    </>
  )
}

export default ExcluirLojaModal
