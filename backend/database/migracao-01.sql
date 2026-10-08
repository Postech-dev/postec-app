-- ==============================================================================
-- Migração 01: colunas usadas pelo frontend integrado ao banco
-- Pode rodar várias vezes (ADD COLUMN IF NOT EXISTS). Use em bancos que já existem;
-- um banco novo já nasce com essas colunas pelo db.sql.
-- ==============================================================================

ALTER TABLE lojas
    ADD COLUMN IF NOT EXISTS prazo_resposta_dias INT NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS endereco_devolucao TEXT NOT NULL DEFAULT '';

ALTER TABLE ocorrencias
    ADD COLUMN IF NOT EXISTS itens_reenviados TEXT,
    ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS canal VARCHAR(20) NOT NULL DEFAULT 'portal',
    ADD COLUMN IF NOT EXISTS responsavel VARCHAR(100),
    ADD COLUMN IF NOT EXISTS nao_lida BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS orientacao_devolucao TEXT;

ALTER TABLE mensagens
    ADD COLUMN IF NOT EXISTS autor_nome VARCHAR(100),
    ADD COLUMN IF NOT EXISTS interna BOOLEAN NOT NULL DEFAULT false;
