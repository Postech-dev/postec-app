-- ==============================================================================
-- PosTec — Banco de Dados Simplificado para o MVP (PostgreSQL)
-- Apenas 4 tabelas | IDs inteiros sequenciais (SERIAL) | Fácil de debugar e programar
-- ==============================================================================

-- 1. LOJAS (Para identificar o e-commerce)
CREATE TABLE IF NOT EXISTS lojas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,      -- Ex: 'mariana-modas' (usado na URL do portal)
    email VARCHAR(100) NOT NULL,
    plano VARCHAR(20) DEFAULT 'Starter'     -- 'Starter' ou 'Pro'
);

-- 2. USUÁRIOS (Quem acessa o painel de atendimento)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    loja_id INT REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,           -- Hash da senha
    role VARCHAR(20) DEFAULT 'atendente'   -- 'admin' ou 'atendente'
);

-- 3. PEDIDOS (Simulação dos pedidos da loja da Mariana)
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    loja_id INT REFERENCES lojas(id) ON DELETE CASCADE,
    numero_pedido VARCHAR(50) NOT NULL,    -- Ex: 'PED-101'
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_cpf VARCHAR(14) NOT NULL,
    cliente_email VARCHAR(100) NOT NULL,
    produto VARCHAR(255) NOT NULL,         -- Nome do produto comprado (texto simples)
    valor NUMERIC(10, 2) NOT NULL,
    data_compra DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 4. OCORRÊNCIAS (O coração do PosTec)
CREATE TABLE IF NOT EXISTS ocorrencias (
    id SERIAL PRIMARY KEY,
    loja_id INT REFERENCES lojas(id) ON DELETE CASCADE,
    pedido_id INT REFERENCES pedidos(id) ON DELETE RESTRICT,
    protocolo VARCHAR(30) UNIQUE NOT NULL, -- Ex: 'POS-1001'
    
    -- Status do fluxo
    status VARCHAR(50) DEFAULT 'Novo',
    -- 'Novo' -> 'Em Triagem' -> 'Aguardando Devolução' -> 'Reenvio Solicitado' / 'Estorno Solicitado' -> 'Concluído'
    
    motivo VARCHAR(100) NOT NULL,          -- Ex: 'Produto com Defeito', 'Tamanho Errado', 'Arrependimento'
    descricao TEXT NOT NULL,               -- Relato do cliente
    
    -- Dados preenchidos quando for resolvido:
    tipo_resolucao VARCHAR(20),            -- 'Reenvio' ou 'Estorno'
    codigo_rastreio VARCHAR(50),           -- Preenchido se for Reenvio
    valor_estorno NUMERIC(10, 2),          -- Preenchido se for Estorno
    comprovante_estorno VARCHAR(100),      -- ID da transação / comprovante PIX
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. MENSAGENS (Histórico de conversa simples da ocorrência)
CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INT REFERENCES ocorrencias(id) ON DELETE CASCADE,
    autor VARCHAR(20) NOT NULL,            -- 'cliente', 'atendente' ou 'sistema'
    texto TEXT NOT NULL,
    enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DADOS DE TESTE PRONTOS (SEED) - Só rodar e testar!
-- ==============================================================================

-- Cria a Loja 1
INSERT INTO lojas (nome, slug, email, plano) 
VALUES ('Mariana Modas', 'mariana-modas', 'contato@marianamodas.com.br', 'Pro')
ON CONFLICT DO NOTHING;

-- Cria a Mariana (Admin)
INSERT INTO usuarios (loja_id, nome, email, senha, role)
VALUES (
    1, 
    'Mariana Silva', 
    'mariana@marianamodas.com.br', 
    'admin123', 
    'admin'
)
ON CONFLICT DO NOTHING;

-- Cria 2 pedidos de exemplo prontos para testar no portal
INSERT INTO pedidos (loja_id, numero_pedido, cliente_nome, cliente_cpf, cliente_email, produto, valor)
VALUES 
    (1, 'PED-101', 'Lucas Avaliador', '12345678901', 'lucas.avaliador@facens.br', 'Vestido Midi Linho Cru - Tam M', 189.90),
    (1, 'PED-102', 'Ana Souza', '98765432100', 'ana.souza@gmail.com', 'Camisa Social Seda Azul', 120.00)
ON CONFLICT DO NOTHING;
