import { useCallback, useEffect, useState } from 'react'

// carrega dados async com estado de erro e "tentar de novo"
// `carregar` precisa ser estável (useCallback)
export function useDados<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    carregar()
      .then((d) => ativo && setDados(d))
      .catch((e: Error) => ativo && setErro(e.message || 'Não foi possível carregar.'))
    return () => {
      ativo = false
    }
  }, [carregar, tentativa])

  const tentarDeNovo = useCallback(() => {
    setErro('')
    setTentativa((t) => t + 1)
  }, [])

  return { dados, setDados, erro, tentarDeNovo }
}
