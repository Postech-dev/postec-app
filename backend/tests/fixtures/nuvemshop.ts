import type { PedidoExterno } from '../../src/integracoes/nuvemshop/pedidos';

export const pedido: PedidoExterno = {
  id: '9007199254740993', number: 120, store_id: '321', contact_name: 'Cliente teste',
  total: '59.90', currency: 'BRL', created_at: '2026-10-01T12:00:00Z', updated_at: '2026-10-01T13:00:00Z',
  status: 'open', payment_status: 'paid', shipping_status: 'unpacked',
  products: [{ id: '9007199254740994', name: 'Camiseta', quantity: 2, price: '19.95', sku: 'CAM-M',
    properties: [{ name: 'Tamanho', value: 'M' }] }, { id: 22, name: 'Meias', quantity: 1, price: '20.00' }],
};
