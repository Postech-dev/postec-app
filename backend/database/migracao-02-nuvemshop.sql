BEGIN;

CREATE TABLE IF NOT EXISTS integracoes_nuvemshop (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL UNIQUE REFERENCES lojas(id) ON DELETE CASCADE,
    store_id TEXT UNIQUE,
    token_criptografado TEXT,
    ativa BOOLEAN NOT NULL DEFAULT false,
    suspensa BOOLEAN NOT NULL DEFAULT false,
    geracao INTEGER NOT NULL DEFAULT 0,
    conectada_em TIMESTAMPTZ,
    sincronizada_em TIMESTAMPTZ,
    reconciliada_em TIMESTAMPTZ,
    erro TEXT,
    webhooks_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nuvemshop_oauth_estados (
    hash TEXT PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em TIMESTAMPTZ NOT NULL
);

ALTER TABLE pedidos
    ALTER COLUMN cliente_cpf DROP NOT NULL,
    ALTER COLUMN cliente_email DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS conta_externa_id TEXT,
    ADD COLUMN IF NOT EXISTS pedido_externo_id TEXT,
    ADD COLUMN IF NOT EXISTS moeda TEXT NOT NULL DEFAULT 'BRL',
    ADD COLUMN IF NOT EXISTS status_pedido TEXT,
    ADD COLUMN IF NOT EXISTS status_pagamento TEXT,
    ADD COLUMN IF NOT EXISTS status_envio TEXT,
    ADD COLUMN IF NOT EXISTS atualizado_externamente_em TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sincronizado_em TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS quantidade INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS tamanho TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_origem_externa_unique
    ON pedidos (loja_id, origem, conta_externa_id, pedido_externo_id)
    WHERE pedido_externo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS pedidos_loja_numero ON pedidos (loja_id, numero_pedido);

CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    item_externo_id TEXT,
    produto TEXT NOT NULL,
    sku TEXT,
    variacao TEXT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(14, 2) NOT NULL CHECK (valor_unitario >= 0)
);

CREATE INDEX IF NOT EXISTS pedido_itens_pedido ON pedido_itens (pedido_id);

-- O contador por COUNT(*) do MVP não suporta criações simultâneas.
CREATE SEQUENCE IF NOT EXISTS ocorrencias_protocolo_seq START 1001;
SELECT setval('ocorrencias_protocolo_seq', GREATEST(
    (SELECT last_value FROM ocorrencias_protocolo_seq),
    COALESCE((SELECT max(substring(protocolo FROM '^POS-([0-9]+)$')::bigint)+1 FROM ocorrencias),1001)
), false);

CREATE TABLE IF NOT EXISTS nuvemshop_tarefas (
    id BIGSERIAL PRIMARY KEY,
    integracao_id INTEGER NOT NULL REFERENCES integracoes_nuvemshop(id) ON DELETE CASCADE,
    geracao INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('webhooks', 'historico', 'reconciliar', 'pedido')),
    parametros JSONB NOT NULL DEFAULT '{}',
    estado TEXT NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'processando', 'concluida', 'falhou', 'cancelada')),
    tentativas INTEGER NOT NULL DEFAULT 0,
    disponivel_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    iniciada_em TIMESTAMPTZ,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    erro TEXT
);

CREATE INDEX IF NOT EXISTS nuvemshop_tarefas_pendentes ON nuvemshop_tarefas (disponivel_em, id)
    WHERE estado IN ('pendente', 'processando');

COMMIT;
