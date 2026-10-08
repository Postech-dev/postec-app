import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert/Alert'
import BackLink from '../components/BackLink/BackLink'
import Button from '../components/Button/Button'
import Card from '../components/Card/Card'
import CsvDropzone from '../components/CsvDropzone/CsvDropzone'
import ImportacaoPreview from '../components/ImportacaoPreview/ImportacaoPreview'
import PageHeader from '../components/PageHeader/PageHeader'
import { useToast } from '../hooks/useToast'
import { importarPedidos, prepararImportacao } from '../services/pedidos.service'
import type { ResultadoImportacao } from '../types'
import { COLUNAS, analisarCsv, baixarModeloCsv, lerArquivoCsv, validarArquivoCsv } from '../utils/csv'
import './pages.css'

function ImportarPedidosPage() {
  const navigate = useNavigate()
  const { mostrar } = useToast()
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [erroArquivo, setErroArquivo] = useState('')
  const [lendo, setLendo] = useState(false)
  const [importando, setImportando] = useState(false)

  async function receber(arquivo: File) {
    const problema = validarArquivoCsv(arquivo)
    setErroArquivo(problema)
    if (problema) return

    setLendo(true)
    try {
      // a leitura e a validação são só para a prévia; o backend valida de novo ao importar
      const texto = await lerArquivoCsv(arquivo)
      const { validas, erros } = analisarCsv(texto)
      setResultado(await prepararImportacao(validas, erros))
      setNomeArquivo(arquivo.name)
    } catch {
      setErroArquivo('Não conseguimos ler esse arquivo. Abra a planilha, salve como CSV de novo e tente outra vez.')
    } finally {
      setLendo(false)
    }
  }

  async function confirmar() {
    if (!resultado) return
    setImportando(true)
    try {
      // envia só as linhas válidas
      const { novos, atualizados } = await importarPedidos(resultado.linhas)
      mostrar(`Importação concluída: ${novos} novos e ${atualizados} atualizados.`)
      navigate('/pedidos')
    } catch {
      setErroArquivo('A importação não terminou. Seus dados continuam aqui; tente confirmar de novo.')
    } finally {
      setImportando(false)
    }
  }

  const validas = resultado ? resultado.novos + resultado.atualizados : 0

  return (
    <div className="pagina">
      <BackLink to="/pedidos">Pedidos</BackLink>
      <PageHeader
        eyebrow="PEDIDOS"
        titulo="Importar pedidos por CSV"
        subtitulo="Envie a planilha da sua loja. Você confere tudo antes de importar."
      />

      {!resultado ? (
        <>
          <Card titulo="1. Baixe o modelo (opcional)">
            <p>
              A planilha precisa destas colunas: <code>{COLUNAS.join(', ')}</code>. Valores podem ser 189,90 ou 1.234,56 e
              datas DD/MM/AAAA ou AAAA-MM-DD.
            </p>
            <div>
              <Button variante="secundario" onClick={baixarModeloCsv}>
                Baixar modelo de planilha
              </Button>
            </div>
          </Card>

          <Card titulo="2. Envie o arquivo">
            <CsvDropzone onArquivo={receber} erro={erroArquivo} ocupado={lendo} />
            <Alert>Pedidos existentes serão atualizados. Importar o mesmo arquivo de novo não duplica nada.</Alert>
          </Card>
        </>
      ) : (
        <>
          <p>
            Arquivo: <strong>{nomeArquivo}</strong>
          </p>
          <ImportacaoPreview resultado={resultado} />
          <Alert>Pedidos existentes serão atualizados. A chave é o número do pedido, então nada é duplicado.</Alert>
          {erroArquivo && (
            <span className="campo-erro" role="alert">
              {erroArquivo}
            </span>
          )}
          <div className="form-acoes">
            <Button
              variante="secundario"
              onClick={() => {
                setResultado(null)
                setErroArquivo('')
              }}
            >
              Escolher outro arquivo
            </Button>
            <Button
              carregando={importando}
              onClick={confirmar}
              motivoDesabilitado={validas === 0 ? 'Nenhuma linha válida para importar' : undefined}
            >
              Confirmar importação
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default ImportarPedidosPage
