const CHAVE = 'postec:demo'

// ?demo=1 na URL liga o modo demonstração e lembra durante a sessão
export function iniciarDemo(): void {
  try {
    if (new URLSearchParams(window.location.search).get('demo') === '1') sessionStorage.setItem(CHAVE, '1')
  } catch {
    // sem acesso ao armazenamento: o modo demo só vale pela variável de ambiente
  }
}

// VITE_DEMO=true no build, ou ?demo=1 aberto nesta sessão
export function modoDemo(): boolean {
  if (import.meta.env.VITE_DEMO === 'true') return true
  try {
    return sessionStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}
