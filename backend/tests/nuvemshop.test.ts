import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { criptografar, descriptografar, assinaturaValida } from '../src/integracoes/nuvemshop/seguranca';
import { lerJsonExterno } from '../src/integracoes/nuvemshop/api';
import { normalizarPedidoExterno } from '../src/integracoes/nuvemshop/pedidos';
import { pedido } from './fixtures/nuvemshop';

Object.assign(process.env, { NUVEMSHOP_APP_ID: '46963', NUVEMSHOP_CLIENT_SECRET: 'segredo-de-teste',
  APP_PUBLIC_URL: 'https://postec.test', NUVEMSHOP_USER_AGENT: 'Postec test', INTEGRATION_ENCRYPTION_KEY: randomBytes(32).toString('base64') });


test('token criptografado usa nonce distinto e detecta adulteração', () => {
  const a = criptografar('token-privado'); const b = criptografar('token-privado');
  assert.notEqual(a, b); assert.ok(!a.includes('token-privado'));
  assert.equal(descriptografar(a), 'token-privado');
  const partes = a.split('.'); partes[2] = Buffer.from('adulterado').toString('base64');
  assert.throws(() => descriptografar(partes.join('.')));
});

test('assinatura usa bytes originais e rejeita assinatura ausente/incorreta', () => {
  const raw = Buffer.from('{ "store_id": 321, "event": "order/paid", "id": 120 }');
  const sig = createHmac('sha256', 'segredo').update(raw).digest('hex');
  assert.equal(assinaturaValida(raw, sig, 'segredo'), true);
  assert.equal(assinaturaValida(Buffer.from(JSON.stringify(JSON.parse(raw.toString()))), sig, 'segredo'), false);
  assert.equal(assinaturaValida(raw, undefined, 'segredo'), false);
  assert.equal(assinaturaValida(raw, '00', 'segredo'), false);
});

test('IDs JSON grandes preservam precisão', () => {
  const data = lerJsonExterno('{"id":9007199254740993,"user_id":9007199254740995,"number":9007199254740997,"total":"12.00"}') as Record<string, unknown>;
  assert.equal(data.id, '9007199254740993'); assert.equal(data.user_id, '9007199254740995');
  assert.equal(data.number, '9007199254740997');
});

test('pedido com vários itens mantém preços decimais e não inventa CPF/email', () => {
  const data = normalizarPedidoExterno(pedido);
  assert.equal(data.quantidade, 3); assert.equal(data.itens.length, 2);
  assert.equal(data.valor, '59.90'); assert.equal(data.cpf, null); assert.equal(data.email, null);
  assert.equal(data.itens[0].variacao, 'Tamanho: M');
  assert.throws(() => normalizarPedidoExterno({ ...pedido, total: '-1' }));
  assert.throws(() => normalizarPedidoExterno({ ...pedido, products: [{ ...pedido.products[0], quantity: 0 }] }));
});
