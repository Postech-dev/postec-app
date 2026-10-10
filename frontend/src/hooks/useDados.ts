import { useCallback, useEffect, useState } from 'react'

// carrega dados async com estado de erro e "tentar de novo"
// `carregar` precisa ser estável (useCallback)
export function useDados<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    carregar()
      .then((d) => { if (ativo) { setDados(d); setCarregando(false) } })
      .catch((e: Error) => { if (ativo) { setErro(e.message || 'Não foi possível carregar.'); setCarregando(false) } })
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
