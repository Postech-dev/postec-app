export class IntegracaoErro extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function configuracao() {
  const appId = process.env.NUVEMSHOP_APP_ID?.trim() || '';
  const secret = process.env.NUVEMSHOP_CLIENT_SECRET?.trim() || '';
  const userAgent = process.env.NUVEMSHOP_USER_AGENT?.trim() || '';
  const chave = process.env.INTEGRATION_ENCRYPTION_KEY || '';
  const faltantes = [!appId && 'App ID', !secret && 'Client Secret', !userAgent && 'identificação do aplicativo',
    !/^[A-Za-z0-9+/]{43}=$/.test(chave) && 'chave de criptografia'].filter(Boolean) as string[];
  let publico = '';
  try {
    const url = new URL(process.env.APP_PUBLIC_URL || '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
        (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) throw new Error();
    publico = url.origin;
  } catch { faltantes.push('URL pública do Postec'); }
  if (appId && !/^\d+$/.test(appId)) faltantes.push('App ID válido');
  return { appId, secret, userAgent, publico, chave, faltantes,
    callback: `${publico}/api/integracoes/nuvemshop/callback`,
    webhook: `${publico}/api/integracoes/nuvemshop/webhook` };
}

export function exigirConfiguracao() {
  const config = configuracao();
  if (config.faltantes.length) throw new IntegracaoErro('A conexão aguarda a configuração do servidor.', 503);
  return config;
}
