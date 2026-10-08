import { useRef, useState } from 'react'
import { LIMITE_CSV_MB } from '../../utils/csv'
import '../Input/Input.css'
import './CsvDropzone.css'

interface CsvDropzoneProps {
  onArquivo: (arquivo: File) => void
  erro?: string
  ocupado?: boolean
}

// área de arrastar e soltar; o botão faz o mesmo para quem usa teclado
function CsvDropzone({ onArquivo, erro, ocupado }: CsvDropzoneProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [sobre, setSobre] = useState(false)

  function soltar(e: React.DragEvent) {
    e.preventDefault()
    setSobre(false)
    const arquivo = e.dataTransfer.files[0]
    if (arquivo) onArquivo(arquivo)
  }

  return (
    <div className="dropzone-bloco">
      <div
        className={`dropzone ${sobre ? 'dropzone-sobre' : ''} ${erro ? 'dropzone-erro' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setSobre(true)
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={soltar}
      >
        <input
          ref={ref}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) onArquivo(arquivo)
            // permite escolher o mesmo arquivo de novo depois de corrigir a planilha
            e.target.value = ''
          }}
        />
        <strong>{ocupado ? 'Lendo a planilha…' : 'Arraste o arquivo .csv aqui'}</strong>
        <span>ou</span>
        <button type="button" className="dropzone-botao" disabled={ocupado} onClick={() => ref.current?.click()}>
          Escolher arquivo
        </button>
        <small>Somente .csv • até {LIMITE_CSV_MB} MB</small>
      </div>
      {erro && (
        <span className="campo-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  )
}

export default CsvDropzone
