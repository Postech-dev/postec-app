import type { PoolClient } from 'pg';

interface ProdutoExterno {
  id: string | number; name: string; sku?: string; quantity: number; price: string | number;
  variant_id?: string | number; properties?: { name: string; value: string }[];
}
export interface PedidoExterno {
  id: string | number; number: string | number; store_id?: string | number;
  contact_name?: string; contact_email?: string; contact_identification?: string;
  billing_name?: string; customer?: { name?: string; email?: string; identification?: string };
  total: string | number; currency: string; created_at: string; updated_at: string;
  status: string; payment_status: string; shipping_status: string; products: ProdutoExterno[];
}

export function normalizarPedidoExterno(p: PedidoExterno) {
  if (!/^\d+$/.test(String(p.id)) || !p.number || !Array.isArray(p.products) || !p.products.length ||
      !/^\d+(\.\d{1,2})?$/.test(String(p.total)) || !/^[A-Z]{3}$/.test(p.currency) ||
      !Number.isFinite(Date.parse(p.created_at)) || !Number.isFinite(Date.parse(p.updated_at))) {
    throw new Error('A Nuvemshop retornou um pedido incompleto. Revise o pedido e tente sincronizar novamente.');
  }
  const itens = p.products.map(item => {
    if (!item.name || !Number.isInteger(item.quantity) || item.quantity < 1 || !/^\d+(\.\d{1,2})?$/.test(String(item.price))) {
      throw new Error('A Nuvemshop retornou um item inválido. Revise o pedido e tente sincronizar novamente.');
    }
    return { id: String(item.id), produto: item.name, sku: item.sku || null,
      variacao: item.properties?.map(prop => `${prop.name}: ${prop.value}`).join(' • ') || null,
      quantidade: item.quantity, valor: String(item.price) };
  });
  const doc = (p.contact_identification || p.customer?.identification || '').replace(/\D/g, '');
  return { id: String(p.id), numero: String(p.number), nome: p.contact_name || p.billing_name || p.customer?.name || 'Cliente não informado',
    cpf: doc.length === 11 ? doc : null, email: p.contact_email || p.customer?.email || null,
    produto: itens.map(i => `${i.quantidade} × ${i.produto}${i.variacao ? ` (${i.variacao})` : ''}`).join(' • ').slice(0, 255),
    quantidade: itens.reduce((sum, i) => sum + i.quantidade, 0), valor: String(p.total), itens };
}

export interface Conexao { id: number; loja_id: number; store_id: string; token_criptografado: string; geracao: number; }

export async function salvarPedidoExterno(client: PoolClient, conexao: Conexao, p: PedidoExterno): Promise<void> {
  if (p.store_id !== undefined && String(p.store_id) !== conexao.store_id) throw new Error('Pedido de outra loja recusado.');
  const v = normalizarPedidoExterno(p);
  await client.query('BEGIN');
  try {
    // Serializa com desconexão/reconexão. Uma tarefa antiga não pode escrever na nova instalação.
    const atual = await client.query(`SELECT id FROM integracoes_nuvemshop WHERE id=$1 AND geracao=$2 AND ativa AND NOT suspensa FOR UPDATE`, [conexao.id, conexao.geracao]);
    if (!atual.rowCount) throw new Error('A conexão foi interrompida.');
    const r = await client.query(`INSERT INTO pedidos
      (loja_id, numero_pedido, cliente_nome, cliente_cpf, cliente_email, produto, valor, data_compra,
       origem, conta_externa_id, pedido_externo_id, moeda, status_pedido, status_pagamento, status_envio,
       atualizado_externamente_em, sincronizado_em, quantidade)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'nuvemshop',$9,$10,$11,$12,$13,$14,$15,now(),$16)
      ON CONFLICT (loja_id, origem, conta_externa_id, pedido_externo_id) WHERE pedido_externo_id IS NOT NULL
      DO UPDATE SET numero_pedido=EXCLUDED.numero_pedido, cliente_nome=EXCLUDED.cliente_nome,
       cliente_cpf=EXCLUDED.cliente_cpf, cliente_email=EXCLUDED.cliente_email, produto=EXCLUDED.produto,
       valor=EXCLUDED.valor, moeda=EXCLUDED.moeda, status_pedido=EXCLUDED.status_pedido,
       status_pagamento=EXCLUDED.status_pagamento, status_envio=EXCLUDED.status_envio,
       atualizado_externamente_em=EXCLUDED.atualizado_externamente_em, sincronizado_em=now(), quantidade=EXCLUDED.quantidade
      WHERE pedidos.atualizado_externamente_em IS NULL OR pedidos.atualizado_externamente_em <= EXCLUDED.atualizado_externamente_em
      RETURNING id`, [conexao.loja_id, v.numero, v.nome, v.cpf, v.email, v.produto, v.valor, p.created_at.slice(0, 10),
      conexao.store_id, v.id, p.currency, p.status, p.payment_status, p.shipping_status, p.updated_at, v.quantidade]);
    if (r.rowCount) {
      const id = r.rows[0].id;
      await client.query('DELETE FROM pedido_itens WHERE pedido_id=$1', [id]);
      for (const item of v.itens) await client.query(`INSERT INTO pedido_itens
        (pedido_id,item_externo_id,produto,sku,variacao,quantidade,valor_unitario) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, item.id, item.produto, item.sku, item.variacao, item.quantidade, item.valor]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
