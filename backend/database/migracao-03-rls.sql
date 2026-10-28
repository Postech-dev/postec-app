-- O acesso aos dados é feito exclusivamente pela API Express, que valida JWT e loja.
-- Nenhuma política de acesso público é criada para a Data API do Supabase.
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE integracoes_nuvemshop ENABLE ROW LEVEL SECURITY;
ALTER TABLE nuvemshop_oauth_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nuvemshop_tarefas ENABLE ROW LEVEL SECURITY;
