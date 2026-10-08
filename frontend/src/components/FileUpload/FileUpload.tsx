import { useRef, useState } from 'react'
import { validarArquivo } from '../../utils/arquivo'
import '../Input/Input.css'
import './FileUpload.css'

interface FileUploadProps {
  rotulo: string
  dica: string
  arquivo: File | null
  onChange: (arquivo: File | null) => void
  erro?: string
}

function tamanho(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// upload só no front por enquanto; o arquivo não é enviado a lugar nenhum
function FileUpload({ rotulo, dica, arquivo, onChange, erro }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [previa, setPrevia] = useState('')
  const [erroArquivo, setErroArquivo] = useState('')

  function limparPrevia() {
    if (previa) URL.revokeObjectURL(previa)
    setPrevia('')
  }

  function escolher(novo: File | null) {
    if (!novo) return
    const problema = validarArquivo(novo)
    setErroArquivo(problema)
    if (ref.current) ref.current.value = ''
    if (problema) return
    limparPrevia()
    if (novo.type.startsWith('image/')) setPrevia(URL.createObjectURL(novo))
    onChange(novo)
  }

  function remover() {
    limparPrevia()
    setErroArquivo('')
    onChange(null)
    if (ref.current) ref.current.value = ''
  }

  const mensagemErro = erroArquivo || erro

  return (
    <div className="upload">
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        hidden
        onChange={(e) => escolher(e.target.files?.[0] ?? null)}
      />
      {arquivo ? (
        <div className="upload-arquivo">
          {previa && <img className="upload-previa" src={previa} alt={`Prévia de ${arquivo.name}`} />}
          <div className="upload-dados">
            <span className="upload-nome">{arquivo.name}</span>
            <span className="upload-tamanho">{tamanho(arquivo.size)}</span>
          </div>
          <button type="button" className="upload-remover" onClick={remover}>
            Remover<span className="so-leitor"> {arquivo.name}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`upload-botao ${mensagemErro ? 'upload-invalido' : ''}`}
          onClick={() => ref.current?.click()}
        >
          <strong>↑ {rotulo}</strong>
          <span>{dica}</span>
        </button>
      )}
      {mensagemErro && (
        <span className="campo-erro" role="alert">
          {mensagemErro}
        </span>
      )}
    </div>
  )
}

export default FileUpload
