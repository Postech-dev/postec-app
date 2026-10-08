import type { ResultadoImportacao } from '../../types'
import { formatarData, formatarMoeda } from '../../utils/format'
import { mascararCpf } from '../../utils/cpf'
import Card from '../Card/Card'
import './ImportacaoPreview.css'

const LINHAS_NA_TABELA = 10
const ERROS_NA_LISTA = 50

function ImportacaoPreview({ resultado }: { resultado: ResultadoImportacao }) {
  const { novos, atualizados, erros, linhas } = resultado

  return (
    <div className="previa">
      <div className="previa-contadores">
        <div className="previa-contador previa-novos">
          <strong>{novos}</strong>
          <span>{novos === 1 ? 'novo' : 'novos'}</span>
        </div>
        <div className="previa-contador previa-atualizados">
          <strong>{atualizados}</strong>
          <span>{atualizados === 1 ? 'será atualizado' : 'serão atualizados'}</span>
        </div>
        <div className="previa-contador previa-erros">
          <strong>{erros.length}</strong>
          <span>{erros.length === 1 ? 'com erro' : 'com erro'}</span>
        </div>
      </div>

      {linhas.length > 0 && (
        <Card titulo={`Primeiras ${Math.min(LINHAS_NA_TABELA, linhas.length)} linhas válidas`}>
          <div className="previa-rolagem">
            <table>
              <thead>
                <tr>
                  <th scope="col">Linha</th>
                  <th scope="col">Pedido</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Produto</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Data</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.slice(0, LINHAS_NA_TABELA).map((l) => (
                  <tr key={l.linha}>
                    <td>{l.linha}</td>
                    <td>{l.numero}</td>
                    <td>{l.clienteNome}</td>
                    <td>{mascararCpf(l.clienteCpf)}</td>
                    <td>{l.produto}</td>
                    <td>{formatarMoeda(l.valor)}</td>
                    <td>{formatarData(l.dataPedido)}</td>
                    <td>
                      <span className={`previa-situacao previa-${l.situacao}`}>
                        {l.situacao === 'novo' ? 'Novo' : 'Atualizar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {erros.length > 0 && (
        <Card titulo="Linhas com erro">
          <p className="previa-ajuda">
            Essas linhas não serão importadas. Corrija na planilha e envie o arquivo de novo, ou confirme só as linhas
            válidas.
          </p>
          <ul className="previa-lista-erros">
            {erros.slice(0, ERROS_NA_LISTA).map((e) => (
              <li key={`${e.linha}-${e.mensagem}`}>
                <strong>{e.linha === 0 ? 'Arquivo' : `Linha ${e.linha}`}:</strong> {e.mensagem}
              </li>
            ))}
          </ul>
          {erros.length > ERROS_NA_LISTA && <p className="previa-ajuda">e mais {erros.length - ERROS_NA_LISTA} erros.</p>}
        </Card>
      )}
    </div>
  )
}

export default ImportacaoPreview
