-- Execute como postgres após criar o login postec_backend e aplicar as migrações.
-- Apenas a API Express usa este login; anon/authenticated não recebem acesso.
GRANT USAGE ON SCHEMA public TO postec_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  lojas, usuarios, pedidos, ocorrencias, mensagens, integracoes_nuvemshop,
  nuvemshop_oauth_estados, pedido_itens, nuvemshop_tarefas
TO postec_backend;
GRANT USAGE, SELECT ON SEQUENCE
  lojas_id_seq, usuarios_id_seq, pedidos_id_seq, ocorrencias_id_seq,
  mensagens_id_seq, integracoes_nuvemshop_id_seq, pedido_itens_id_seq,
  nuvemshop_tarefas_id_seq, ocorrencias_protocolo_seq
TO postec_backend;

DO $$
DECLARE tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['lojas', 'usuarios', 'pedidos', 'ocorrencias', 'mensagens',
    'integracoes_nuvemshop', 'nuvemshop_oauth_estados', 'pedido_itens', 'nuvemshop_tarefas']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=tabela AND policyname='postec_backend_access') THEN
      EXECUTE format('CREATE POLICY postec_backend_access ON public.%I FOR ALL TO postec_backend USING (true) WITH CHECK (true)', tabela);
    END IF;
  END LOOP;
END $$;
