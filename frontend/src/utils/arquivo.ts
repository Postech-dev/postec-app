const TIPOS = ['image/jpeg', 'image/png', 'application/pdf']
export const LIMITE_MB = 10

// devolve a mensagem de erro, ou vazio se o arquivo é aceito
export function validarArquivo(arquivo: File): string {
  if (!TIPOS.includes(arquivo.type)) {
    return 'Esse tipo de arquivo não é aceito. Envie uma imagem JPG, PNG ou um PDF.'
  }
  if (arquivo.size > LIMITE_MB * 1024 * 1024) {
    return `O arquivo passa de ${LIMITE_MB} MB. Reduza o tamanho ou escolha outro.`
  }
  return ''
}
