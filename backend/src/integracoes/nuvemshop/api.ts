import { exigirConfiguracao, IntegracaoErro } from './config';

// Node >=22 preserva o texto de números JSON no reviver; IDs grandes não passam por arredondamento.
export function lerJsonExterno(texto: string): unknown {
  return JSON.parse(texto, (key: string, value: unknown, context?: { source: string }) => {
    if (typeof value === 'number' && (!Number.isSafeInteger(value)) && /(^id$|_id$|^number$)/.test(key)) {
      if (!context?.source || !/^\d+$/.test(context.source)) throw new Error('Identificador externo inválido.');
      return context.source;
    }
    return value;
  });
}

export class NuvemshopApiErro extends IntegracaoErro {
  constructor(public codigo: number) {
    super(codigo === 401 || codigo === 403 ? 'A Nuvemshop recusou o acesso. Confira as permissões ou reconecte a loja.' :
      codigo === 402 ? 'A Nuvemshop suspendeu o acesso à API desta loja.' :
      codigo === 429 ? 'Limite de consultas da Nuvemshop atingido. Tentaremos novamente.' :
      'Não foi possível consultar a Nuvemshop. Tentaremos novamente.', 502);
  }
}

export async function trocarCodigo(code: string): Promise<{ access_token: string; user_id: string; scope: string }> {
  const config = exigirConfiguracao();
  const r = await fetch('https://www.nuvemshop.com.br/apps/authorize/token', {
    method: 'POST', signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': config.userAgent },
    body: JSON.stringify({ client_id: config.appId, client_secret: config.secret, code, grant_type: 'authorization_code' }),
  });
  if (!r.ok) throw new IntegracaoErro('Não foi possível autorizar a loja. Inicie a conexão novamente.', 502);
  const data = lerJsonExterno(await r.text()) as Record<string, unknown>;
  if (typeof data.access_token !== 'string' || !/^\d+$/.test(String(data.user_id)) ||
      !String(data.scope || '').split(/[ ,]+/).some(s => s === 'read_orders' || s === 'write_orders')) {
    throw new IntegracaoErro('Autorize a leitura de pedidos no aplicativo e conecte novamente.', 400);
  }
  return { access_token: data.access_token, user_id: String(data.user_id), scope: String(data.scope) };
}

// URL construída somente com identificadores e caminhos internos, nunca com URLs de notificações.
export async function chamarNuvemshop<T>(storeId: string, token: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  if (!/^\d+$/.test(storeId) || !path.startsWith('/') || path.includes('://')) throw new Error('Recurso inválido');
  const config = exigirConfiguracao();
  const r = await fetch(`https://api.nuvemshop.com.br/2025-03/${storeId}${path}`, {
    method, signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': config.userAgent, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // A API real retorna 404 (Last page is 0) quando a consulta de pedidos não tem resultados.
  // Não confundir com pedido individual inexistente ou outros erros de rota/permissão.
  if (r.status === 404 && method === 'GET' && path.split('?')[0] === '/orders') {
    try {
      const erro = lerJsonExterno(await r.text()) as Record<string, unknown>;
      if (erro?.code === 404 && erro.description === 'Last page is 0') return [] as T;
    } catch { /* Respostas inesperadas continuam sendo falhas HTTP. */ }
  }
  if (!r.ok) throw new NuvemshopApiErro(r.status);
  if (r.status === 204) return undefined as T;
  return lerJsonExterno(await r.text()) as T;
}
