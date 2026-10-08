import { useCallback, useEffect, useState } from 'react'
import type { Mensagem } from '../types'

interface Fonte {
  listar: () => Promise<Mensagem[]>
  observar: (aoMudar: (m: Mensagem[]) => void) => () => void
}

// histórico de mensagens atualizado sozinho (polling no service)
// `fonte` precisa ser estável (useMemo)
export function useMensagens(fonte: Fonte) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])

  useEffect(() => {
    let ativo = true
    fonte.listar().then((m) => ativo && setMensagens(m))
    const parar = fonte.observar(setMensagens)
    return () => {
      ativo = false
      parar()
    }
  }, [fonte])

  const recarregar = useCallback(async () => setMensagens(await fonte.listar()), [fonte])

  return { mensagens, recarregar }
}
