import { useCallback, useEffect, useState } from 'react'

// carrega dados async com estado de erro e "tentar de novo"
// `carregar` precisa ser estável (useCallback)
export function useDados<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [concluida, setConcluida] = useState<{ carregar: () => Promise<T>; tentativa: number } | null>(null)
  const carregando = concluida?.carregar !== carregar || concluida?.tentativa !== tentativa

  useEffect(() => {
    let ativo = true
    carregar()
      .then((d) => { if (ativo) { setDados(d); setConcluida({ carregar, tentativa }) } })
      .catch((e: Error) => { if (ativo) { setErro(e.message || 'Não foi possível carregar.'); setConcluida({ carregar, tentativa }) } })
    return () => {
      ativo = false
    }
  }, [carregar, tentativa])

  const tentarDeNovo = useCallback(() => {
    setErro('')
    setDados(null)
    setTentativa((t) => t + 1)
  }, [])

  return { dados, setDados, erro, tentarDeNovo, carregando }
}
