-- ==============================================================================
-- PosTec - dados de teste e demonstracao (PostgreSQL)
-- ==============================================================================
-- COMO RODAR:
--   docker exec -i postec-database psql -U postec_user -d postec_db < backend/database/testes.sql
--   (no PowerShell: Get-Content backend/database/testes.sql | docker exec -i postec-database psql -U postec_user -d postec_db)
--
-- O script garante as colunas novas (ALTER TABLE ... IF NOT EXISTS), entao funciona
-- em banco novo ou antigo, desde que as tabelas de db.sql existam.
--
-- ATENCAO: o comando TRUNCATE logo abaixo APAGA todos os dados das 5 tabelas e
-- reinicia os IDs. E isso que deixa a demonstracao sempre igual. Nao rode em um
-- banco com dados que voce quer manter.
--
-- As datas sao relativas a "hoje" (momento em que o script roda). Rode de novo
-- antes de apresentar para os casos aparecerem como recentes.
--
-- LOGINS (painel):
--   mariana@marianamodas.com.br          admin123       admin      Mariana Modas (plano business)
--   paula@marianamodas.com.br            atendente123   atendente  Mariana Modas
--   carlos@marianamodas.com.br           atendente123   atendente  Mariana Modas
--   anapaula@ateliemariana.com.br        admin123       admin      Ateliê Mariana (plano starter)
--   fernando@casaverdedecor.com.br       admin123       admin      Casa Verde Decor (plano pro)
--   (as senhas estao gravadas como hash bcrypt; o login aceita hash e texto puro)
--
-- ROTEIRO RAPIDO (portal: /portal/mariana-modas):
--   Cliente abre uma solicitacao nova ........ PED-200  CPF 875.123.649-46  (Maria Souza, sem ocorrencia)
--   Outro pedido sem ocorrencia ............... PED-201  CPF 198.273.645-37
--   Caso novo de hoje (painel) ................ POS-1022 (Lucas Avaliador, PED-101, CPF 123.456.789-09)
--   Acompanhar com devolucao pendente ......... POS-1011, POS-1012, POS-1016
--   Caso ja concluido com reenvio ............. POS-1003 (rastreio NX601284539BR)
--   Caso ja concluido com estorno ............. POS-1004 (PIX-B41D08E5)
--   Casos abertos pela loja (canal) ........... POS-1004 (telefone), POS-1010 (instagram), POS-1015 (e-mail)
--   O proximo protocolo gerado pelo portal sera POS-1028.
--
-- ISOLAMENTO POR LOJA: o Lucas (CPF 123.456.789-09) tem pedido na Mariana Modas
-- (PED-101) e na Casa Verde Decor (PED-701). Cada loja so enxerga os seus.
--
-- AINDA NAO TEM COLUNA NO BANCO: token do link de acompanhamento (/portal/:slug/caso/:token).
--
-- OBSERVACAO: plano em minusculo (starter/pro/business), como o frontend espera;
-- status com a grafia do backend ("Em Triagem", "Reenvio Solicitado", etc.).
-- ==============================================================================

BEGIN;

-- colunas usadas pela interface (mesmo conteudo de backend/database/migracao-01.sql)
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

TRUNCATE TABLE mensagens, ocorrencias, pedidos, usuarios, lojas RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------- LOJAS
INSERT INTO lojas (nome, slug, email, plano, prazo_resposta_dias, endereco_devolucao) VALUES
    ('Mariana Modas', 'mariana-modas', 'atendimento@marianamodas.com.br', 'business', 2, 'Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000'),
    ('Ateliê Mariana', 'atelie-mariana', 'contato@ateliemariana.com.br', 'starter', 3, 'Ateliê Mariana - Av. Paulista, 900, sala 12, São Paulo/SP, CEP 01310-100'),
    ('Casa Verde Decor', 'casa-verde-decor', 'contato@casaverdedecor.com.br', 'pro', 1, 'Casa Verde Decor - Rua das Palmeiras, 55, Campinas/SP, CEP 13015-000');

-- ---------------------------------------------------------------- USUARIOS
INSERT INTO usuarios (loja_id, nome, email, senha, role)
SELECT l.id, v.nome, v.email, v.senha, v.role FROM (VALUES
    (1, 'mariana-modas', 'Mariana Silva', 'mariana@marianamodas.com.br', '$2b$10$NuZo.4h94NDkUkO4eyerdeifEkxiXWCSaUeSWERo/Om6QzHv3meF2', 'admin'),
    (2, 'mariana-modas', 'Paula Rocha', 'paula@marianamodas.com.br', '$2b$10$n1GBj89Ss8FruNY2/Fnp6OE./yGG9b5c8/mgV4pXMSTGbLzTVkg0O', 'atendente'),
    (3, 'mariana-modas', 'Carlos Menezes', 'carlos@marianamodas.com.br', '$2b$10$n1GBj89Ss8FruNY2/Fnp6OE./yGG9b5c8/mgV4pXMSTGbLzTVkg0O', 'atendente'),
    (4, 'atelie-mariana', 'Ana Paula Ribeiro', 'anapaula@ateliemariana.com.br', '$2b$10$NuZo.4h94NDkUkO4eyerdeifEkxiXWCSaUeSWERo/Om6QzHv3meF2', 'admin'),
    (5, 'casa-verde-decor', 'Fernando Lima', 'fernando@casaverdedecor.com.br', '$2b$10$NuZo.4h94NDkUkO4eyerdeifEkxiXWCSaUeSWERo/Om6QzHv3meF2', 'admin')
) AS v(n, slug, nome, email, senha, role)
JOIN lojas l ON l.slug = v.slug
ORDER BY v.n;

-- ---------------------------------------------------------------- PEDIDOS
INSERT INTO pedidos (loja_id, numero_pedido, cliente_nome, cliente_cpf, cliente_email, produto, valor, data_compra)
SELECT l.id, v.numero, v.nome, v.cpf, v.email, v.produto, v.valor, CURRENT_DATE - v.dias
FROM (VALUES
    (1, 'mariana-modas', 'PED-101', 'Lucas Avaliador', '12345678909', 'lucas.avaliador@facens.br', 'Vestido Midi Linho Cru - Tam M', 189.90, 1),
    (2, 'mariana-modas', 'PED-102', 'Ana Costa', '11144477735', 'ana.costa@gmail.com', 'Camisa Social Slim - Tam P', 129.90, 2),
    (3, 'mariana-modas', 'PED-103', 'Julia Santos', '52998224725', 'julia.santos@outlook.com', 'Saia Plissada Midi - Tam M', 159.90, 3),
    (4, 'mariana-modas', 'PED-104', 'Pedro Lima', '39053344705', 'pedro.lima@gmail.com', 'Jaqueta Jeans Clara - Tam G', 249.90, 4),
    (5, 'mariana-modas', 'PED-105', 'Carla Oliveira', '11122233396', 'carla.oliveira@gmail.com', 'Blusa de Seda Off White - Tam M', 139.90, 5),
    (6, 'mariana-modas', 'PED-106', 'Beatriz Souza', '24681357928', 'beatriz.souza@hotmail.com', 'Calça Alfaiataria Preta - Tam 38', 219.90, 12),
    (7, 'mariana-modas', 'PED-107', 'Lucas Avaliador', '12345678909', 'lucas.avaliador@facens.br', 'Bolsa Tote Caramelo', 249.90, 25),
    (8, 'mariana-modas', 'PED-108', 'Marcos Pereira', '13579246828', 'marcos.pereira@gmail.com', 'Camiseta Linho Areia - Tam G (2 un.)', 179.80, 20),
    (9, 'mariana-modas', 'PED-109', 'Fernanda Alves', '98765432100', 'fernanda.alves@gmail.com', 'Cardigan Tricô Cinza - Tam M', 199.90, 35),
    (10, 'mariana-modas', 'PED-110', 'Rafael Mendes', '32165498791', 'rafael.mendes@gmail.com', 'Short Linho Bege - Tam 40', 119.90, 33),
    (11, 'mariana-modas', 'PED-111', 'Camila Rocha', '45678912364', 'camila.rocha@outlook.com', 'Macacão Pantalona Preto - Tam P', 289.90, 30),
    (12, 'mariana-modas', 'PED-112', 'Thiago Barbosa', '15935748606', 'thiago.barbosa@gmail.com', 'Blazer Alfaiataria Off White - Tam M', 329.90, 29),
    (13, 'mariana-modas', 'PED-113', 'Patrícia Gomes', '75395185291', 'patricia.gomes@gmail.com', 'Vestido Longo Estampado - Tam G', 259.90, 28),
    (14, 'mariana-modas', 'PED-114', 'Gustavo Ribeiro', '26481735955', 'gustavo.ribeiro@hotmail.com', 'Cinto de Couro Caramelo', 89.90, 27),
    (15, 'mariana-modas', 'PED-115', 'Larissa Martins', '84261739500', 'larissa.martins@gmail.com', 'Lenço de Seda Floral', 79.90, 26),
    (16, 'mariana-modas', 'PED-116', 'Eduardo Nunes', '67194382555', 'eduardo.nunes@gmail.com', 'Tênis Branco Casual - Tam 42', 299.90, 26),
    (17, 'mariana-modas', 'PED-117', 'Juliana Castro', '93827514673', 'juliana.castro@outlook.com', 'Sandália Salto Bloco - Tam 36', 199.90, 24),
    (18, 'mariana-modas', 'PED-118', 'Felipe Araújo', '51938472691', 'felipe.araujo@gmail.com', 'Regata Canelada Preta - Tam M (3 un.)', 149.70, 23),
    (19, 'mariana-modas', 'PED-119', 'Aline Ferreira', '40713695820', 'aline.ferreira@gmail.com', 'Body Manga Longa Branco - Tam P', 99.90, 22),
    (20, 'mariana-modas', 'PED-120', 'Bruna Carvalho', '28596134719', 'bruna.carvalho@gmail.com', 'Saia Midi Couro Eco - Tam 38', 229.90, 21),
    (21, 'mariana-modas', 'PED-121', 'Renata Dias', '71628453982', 'renata.dias@hotmail.com', 'Vestido Midi Linho Cru - Tam P', 189.90, 20),
    (22, 'mariana-modas', 'PED-122', 'Vinícius Teixeira', '09458271649', 'vinicius.teixeira@gmail.com', 'Jaqueta Jeans Clara - Tam M', 249.90, 19),
    (23, 'mariana-modas', 'PED-123', 'Daniela Moreira', '36284719582', 'daniela.moreira@gmail.com', 'Blusa de Seda Off White - Tam P', 139.90, 18),
    (24, 'mariana-modas', 'PED-124', 'Ana Costa', '11144477735', 'ana.costa@gmail.com', 'Calça Alfaiataria Preta - Tam 40', 219.90, 16),
    (25, 'mariana-modas', 'PED-125', 'Julia Santos', '52998224725', 'julia.santos@outlook.com', 'Camisa Social Slim - Tam M', 129.90, 15),
    (26, 'mariana-modas', 'PED-126', 'Carla Oliveira', '11122233396', 'carla.oliveira@gmail.com', 'Vestido Longo Estampado - Tam M', 259.90, 14),
    (27, 'mariana-modas', 'PED-127', 'Patrícia Gomes', '75395185291', 'patricia.gomes@gmail.com', 'Lenço de Seda Floral (2 un.)', 159.80, 13),
    (28, 'mariana-modas', 'PED-128', 'Larissa Martins', '84261739500', 'larissa.martins@gmail.com', 'Sandália Salto Bloco - Tam 37', 199.90, 11),
    (29, 'mariana-modas', 'PED-129', 'Fernanda Alves', '98765432100', 'fernanda.alves@gmail.com', 'Short Linho Bege - Tam 38', 119.90, 9),
    (30, 'mariana-modas', 'PED-130', 'Camila Rocha', '45678912364', 'camila.rocha@outlook.com', 'Cinto de Couro Caramelo', 89.90, 8),
    (31, 'mariana-modas', 'PED-131', 'Beatriz Souza', '24681357928', 'beatriz.souza@hotmail.com', 'Body Manga Longa Branco - Tam M (2 un.)', 199.80, 6),
    (32, 'mariana-modas', 'PED-132', 'Rafael Mendes', '32165498791', 'rafael.mendes@gmail.com', 'Camiseta Linho Areia - Tam G', 89.90, 4),
    (33, 'mariana-modas', 'PED-133', 'Renata Dias', '71628453982', 'renata.dias@hotmail.com', 'Cardigan Tricô Cinza - Tam P', 199.90, 3),
    (34, 'mariana-modas', 'PED-200', 'Maria Souza', '87512364946', 'maria.souza@gmail.com', 'Vestido Midi Linho Cru - Tam M', 189.90, 1),
    (35, 'mariana-modas', 'PED-201', 'Roberto Farias', '19827364537', 'roberto.farias@gmail.com', 'Jaqueta Jeans Clara - Tam G', 249.90, 2),
    (36, 'atelie-mariana', 'PED-501', 'Helena Prado', '54738291637', 'helena.prado@gmail.com', 'Caneca Artesanal Azul (2 un.)', 178.00, 14),
    (37, 'atelie-mariana', 'PED-502', 'Otávio Lins', '62391547846', 'otavio.lins@gmail.com', 'Vaso de Cerâmica Média', 129.00, 22),
    (38, 'atelie-mariana', 'PED-503', 'Sílvia Moraes', '78145629373', 'silvia.moraes@outlook.com', 'Tapete de Crochê 1,20m', 210.00, 8),
    (39, 'atelie-mariana', 'PED-504', 'Caio Menezes', '43982165709', 'caio.menezes@gmail.com', 'Luminária de Palha', 175.00, 6),
    (40, 'atelie-mariana', 'PED-505', 'Lúcia Fontes', '95217638419', 'lucia.fontes@gmail.com', 'Jogo de Pratos Esmaltados', 240.00, 12),
    (41, 'atelie-mariana', 'PED-506', 'Yara Siqueira', '31658924746', 'yara.siqueira@hotmail.com', 'Almofada Bordada (3 un.)', 294.00, 3),
    (42, 'casa-verde-decor', 'PED-701', 'Lucas Avaliador', '12345678909', 'lucas.avaliador@facens.br', 'Zamioculca com Vaso', 119.90, 10),
    (43, 'casa-verde-decor', 'PED-702', 'Mônica Prates', '67429183573', 'monica.prates@gmail.com', 'Kit Jardim Vertical', 349.90, 15),
    (44, 'casa-verde-decor', 'PED-703', 'Heitor Lacerda', '82936415764', 'heitor.lacerda@gmail.com', 'Fita LED Quente 5m', 89.90, 7),
    (45, 'casa-verde-decor', 'PED-704', 'Isabela Duarte', '14573298673', 'isabela.duarte@outlook.com', 'Cortina de Linho 2,20m', 279.90, 5),
    (46, 'casa-verde-decor', 'PED-705', 'Rogério Salles', '59361842773', 'rogerio.salles@gmail.com', 'Espelho Orgânico', 459.00, 9)
) AS v(n, slug, numero, nome, cpf, email, produto, valor, dias)
JOIN lojas l ON l.slug = v.slug
ORDER BY v.n;

-- ---------------------------------------------------------------- OCORRENCIAS
-- protocolos POS-1001..POS-1027, em ordem; o backend gera o proximo como 1000 + total + 1
INSERT INTO ocorrencias (loja_id, pedido_id, protocolo, status, motivo, descricao, tipo_resolucao, codigo_rastreio, itens_reenviados, valor_estorno, comprovante_estorno, canal, responsavel, nao_lida, orientacao_devolucao, criado_em)
SELECT l.id, p.id, v.protocolo, v.status, v.motivo, v.descricao, v.tipo, v.rastreio, v.itens, v.valor, v.comprovante, v.canal, v.responsavel, v.nao_lida, v.orientacao,
       LEAST(date_trunc('day', localtimestamp) - make_interval(days => v.dias) + v.hora::time, localtimestamp - interval '5 minutes')
FROM (VALUES
    (1, 'POS-1001', 'mariana-modas', 'PED-110', 'Concluído', 'Tamanho incorreto', 'Pedi o short no tamanho 40, mas veio o 38. Não serve em mim.', 'Reenvio', 'QB482915307BR', '1 × Short Linho Bege • Tam. 40', NULL::numeric, NULL::text, 'portal', 'Paula Rocha', false, NULL::text, 20, '09:12'),
    (2, 'POS-1002', 'mariana-modas', 'PED-109', 'Concluído', 'Arrependimento', 'Me arrependi da compra, a cor não combina com o que eu tenho. Quero devolver.', 'Estorno', NULL::text, NULL::text, 199.90, 'PIX-7F3A92C1', 'portal', 'Carlos Menezes', false, NULL::text, 19, '14:05'),
    (3, 'POS-1003', 'mariana-modas', 'PED-111', 'Concluído', 'Produto com defeito', 'O macacão veio com a costura da perna aberta. Nem consegui usar.', 'Reenvio', 'NX601284539BR', '1 × Macacão Pantalona Preto • Tam. P', NULL::numeric, NULL::text, 'portal', 'Mariana Silva', false, NULL::text, 18, '10:30'),
    (4, 'POS-1004', 'mariana-modas', 'PED-112', 'Concluído', 'Atraso de entrega', 'Comprei o blazer há mais de 15 dias e ele ainda não chegou. O rastreio não anda.', 'Estorno', NULL::text, NULL::text, 329.90, 'PIX-B41D08E5', 'telefone', 'Paula Rocha', false, NULL::text, 17, '16:48'),
    (5, 'POS-1005', 'mariana-modas', 'PED-113', 'Concluído', 'Produto com defeito', 'O vestido desbotou na primeira lavagem, seguindo a etiqueta direitinho.', 'Reenvio', 'LB739406128BR', '1 × Vestido Longo Estampado • Tam. G', NULL::numeric, NULL::text, 'portal', 'Carlos Menezes', false, NULL::text, 15, '11:20'),
    (6, 'POS-1006', 'mariana-modas', 'PED-114', 'Concluído', 'Arrependimento', 'O cinto é mais largo do que parecia nas fotos. Prefiro devolver.', 'Estorno', NULL::text, NULL::text, 89.90, 'PIX-2C9E5A77', 'portal', 'Mariana Silva', false, NULL::text, 14, '08:55'),
    (7, 'POS-1007', 'mariana-modas', 'PED-116', 'Concluído', 'Tamanho incorreto', 'Pedi o tênis 42 e veio 40, que apertou muito.', 'Reenvio', 'OZ158372946BR', '1 × Tênis Branco Casual • Tam. 42', NULL::numeric, NULL::text, 'portal', 'Paula Rocha', false, NULL::text, 12, '15:10'),
    (8, 'POS-1008', 'mariana-modas', 'PED-117', 'Concluído', 'Atraso de entrega', 'A sandália era para um casamento no sábado e chegou só na segunda. Quero o dinheiro de volta.', 'Estorno', NULL::text, NULL::text, 199.90, 'PIX-9D03F1AB', 'portal', 'Carlos Menezes', false, NULL::text, 11, '13:30'),
    (9, 'POS-1009', 'mariana-modas', 'PED-118', 'Reenvio Solicitado', 'Produto com defeito', 'Uma das três regatas veio com o tecido furado na barra.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Mariana Silva', false, NULL::text, 9, '10:15'),
    (10, 'POS-1010', 'mariana-modas', 'PED-119', 'Estorno Solicitado', 'Arrependimento', 'Comprei sem ver que o tecido é sintético. Quero devolver e receber de volta.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'instagram', 'Paula Rocha', false, NULL::text, 8, '17:02'),
    (11, 'POS-1011', 'mariana-modas', 'PED-120', 'Aguardando Devolução', 'Tamanho incorreto', 'A saia ficou grande na cintura. Pedi 38 mas preciso do 36.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Carlos Menezes', true, 'Para devolver, embale a peça na embalagem original, com a etiqueta, e envie para: Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000. A postagem é por nossa conta: é só pedir o código de coleta aqui.', 7, '09:35'),
    (12, 'POS-1012', 'mariana-modas', 'PED-121', 'Aguardando Devolução', 'Arrependimento', 'Mudei de ideia sobre o vestido. Posso devolver?', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Mariana Silva', true, 'Para devolver, embale a peça na embalagem original, com a etiqueta, e envie para: Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000. A postagem é por nossa conta: é só pedir o código de coleta aqui.', 6, '14:20'),
    (13, 'POS-1013', 'mariana-modas', 'PED-122', 'Em Triagem', 'Produto com defeito', 'O botão da jaqueta caiu logo no primeiro dia de uso.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Paula Rocha', true, NULL::text, 5, '11:45'),
    (14, 'POS-1014', 'mariana-modas', 'PED-123', 'Em Triagem', 'Atraso de entrega', 'Já passou do prazo de entrega da blusa e o rastreio está parado em São Paulo.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Carlos Menezes', false, NULL::text, 4, '16:30'),
    (15, 'POS-1015', 'mariana-modas', 'PED-124', 'Em Triagem', 'Tamanho incorreto', 'A calça 40 ficou apertada no quadril, preciso do 42.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'email', 'Mariana Silva', true, NULL::text, 4, '19:10'),
    (16, 'POS-1016', 'mariana-modas', 'PED-125', 'Aguardando Devolução', 'Produto com defeito', 'A camisa veio com uma mancha de tinta no punho.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Paula Rocha', true, 'Para devolver, embale a peça na embalagem original, com a etiqueta, e envie para: Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000. A postagem é por nossa conta: é só pedir o código de coleta aqui.', 3, '09:00'),
    (17, 'POS-1017', 'mariana-modas', 'PED-126', 'Reenvio Solicitado', 'Produto com defeito', 'O zíper do vestido emperra e não fecha até o final.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Carlos Menezes', false, NULL::text, 3, '13:25'),
    (18, 'POS-1018', 'mariana-modas', 'PED-127', 'Estorno Solicitado', 'Atraso de entrega', 'Os lenços chegaram depois do aniversário que eu ia presentear. Quero o estorno.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Mariana Silva', false, NULL::text, 2, '10:40'),
    (19, 'POS-1019', 'mariana-modas', 'PED-128', 'Novo', 'Tamanho incorreto', 'A sandália 37 ficou pequena, parece que a numeração é menor.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', NULL::text, true, NULL::text, 2, '18:15'),
    (20, 'POS-1020', 'mariana-modas', 'PED-129', 'Novo', 'Produto com defeito', 'O short desfiou na barra depois de uma lavada.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', NULL::text, true, NULL::text, 1, '12:30'),
    (21, 'POS-1021', 'mariana-modas', 'PED-131', 'Em Triagem', 'Arrependimento', 'Os bodies não são do jeito que eu esperava. Gostaria de devolver.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Mariana Silva', true, NULL::text, 1, '20:05'),
    (22, 'POS-1022', 'mariana-modas', 'PED-101', 'Novo', 'Produto com defeito', 'O zíper do vestido quebrou na primeira vez que usei. Segue a foto.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', NULL::text, true, NULL::text, 0, '08:20'),
    (23, 'POS-1023', 'atelie-mariana', 'PED-502', 'Concluído', 'Produto com defeito', 'O vaso chegou trincado na base.', 'Reenvio', 'RK294851736BR', '1 × Vaso de Cerâmica Média', NULL::numeric, NULL::text, 'portal', 'Ana Paula Ribeiro', false, NULL::text, 10, '11:00'),
    (24, 'POS-1024', 'atelie-mariana', 'PED-505', 'Em Triagem', 'Atraso de entrega', 'O jogo de pratos ainda não chegou e o prazo acabou ontem.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Ana Paula Ribeiro', false, NULL::text, 3, '15:40'),
    (25, 'POS-1025', 'atelie-mariana', 'PED-503', 'Novo', 'Tamanho incorreto', 'O tapete é bem menor do que 1,20m, parece uns 90cm.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', NULL::text, true, NULL::text, 1, '09:30'),
    (26, 'POS-1026', 'casa-verde-decor', 'PED-702', 'Estorno Solicitado', 'Produto com defeito', 'Faltaram peças no kit de jardim vertical e não consigo montar.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', 'Fernando Lima', true, NULL::text, 4, '10:10'),
    (27, 'POS-1027', 'casa-verde-decor', 'PED-701', 'Novo', 'Atraso de entrega', 'A planta ainda não chegou e o prazo de entrega já venceu.', NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::text, 'portal', NULL::text, true, NULL::text, 1, '14:50')
) AS v(n, protocolo, slug, numero, status, motivo, descricao, tipo, rastreio, itens, valor, comprovante, canal, responsavel, nao_lida, orientacao, dias, hora)
JOIN lojas l ON l.slug = v.slug
JOIN pedidos p ON p.loja_id = l.id AND p.numero_pedido = v.numero
ORDER BY v.n;

-- ---------------------------------------------------------------- MENSAGENS
-- a primeira mensagem de cada caso e o relato do cliente (ou o evento, nos casos abertos pela loja)
-- (o historico e lido por id, por isso o INSERT respeita a ordem de n)
INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, interna, texto, enviado_em)
SELECT o.id, v.autor, COALESCE(v.autor_nome, CASE v.autor WHEN 'cliente' THEN p.cliente_nome END), v.interna, v.texto,
       LEAST(o.criado_em + make_interval(mins => v.minutos), localtimestamp - interval '1 minute')
FROM (VALUES
    (1, 'POS-1001', 'cliente', NULL::text, false, 'Pedi o short no tamanho 40, mas veio o 38. Não serve em mim.', 0),
    (2, 'POS-1001', 'atendente', 'Paula Rocha', false, 'Olá, Rafael! Sentimos muito pelo engano. Vamos enviar o tamanho 40 sem custo. Pode confirmar se o 38 está sem uso?', 95),
    (3, 'POS-1001', 'atendente', 'Paula Rocha', true, 'Conferir se o 38 volta ao estoque ou vai para promoção.', 100),
    (4, 'POS-1001', 'cliente', NULL::text, false, 'Está sem uso, com a etiqueta.', 160),
    (5, 'POS-1001', 'atendente', 'Paula Rocha', false, 'Perfeito! Enviamos o short 40 hoje. Assim que postarmos, você recebe o código de rastreio por e-mail.', 1450),
    (6, 'POS-1001', 'sistema', 'Sistema', false, 'Chamado concluído com Reenvio. Código de rastreio: QB482915307BR', 1480),
    (7, 'POS-1002', 'cliente', NULL::text, false, 'Me arrependi da compra, a cor não combina com o que eu tenho. Quero devolver.', 0),
    (8, 'POS-1002', 'atendente', 'Carlos Menezes', false, 'Oi, Fernanda! Sem problemas, dentro do prazo de 7 dias você pode desistir. Embale a peça com a etiqueta e envie para o nosso endereço.', 70),
    (9, 'POS-1002', 'cliente', NULL::text, false, 'Postei hoje nos Correios, o código é QQ123456789BR.', 3100),
    (10, 'POS-1002', 'atendente', 'Carlos Menezes', false, 'Recebemos a peça, tudo certo! Estamos fazendo o estorno via PIX.', 7200),
    (11, 'POS-1002', 'sistema', 'Sistema', false, 'Chamado concluído com Estorno no valor de R$ 199.90. Comprovante: PIX-7F3A92C1', 7230),
    (12, 'POS-1003', 'cliente', NULL::text, false, 'O macacão veio com a costura da perna aberta. Nem consegui usar.', 0),
    (13, 'POS-1003', 'atendente', 'Mariana Silva', false, 'Olá, Camila! Que chato isso, desculpe. Pode mandar uma foto da costura?', 45),
    (14, 'POS-1003', 'cliente', NULL::text, false, 'Mandei a foto por e-mail também. Dá para ver bem a costura aberta.', 110),
    (15, 'POS-1003', 'atendente', 'Mariana Silva', false, 'Recebemos! Vamos reenviar um macacão novo, já revisado pela nossa equipe.', 200),
    (16, 'POS-1003', 'atendente', 'Mariana Silva', false, 'Reenvio postado! O código de rastreio já está no seu e-mail.', 2900),
    (17, 'POS-1003', 'sistema', 'Sistema', false, 'Chamado concluído com Reenvio. Código de rastreio: NX601284539BR', 2930),
    (18, 'POS-1004', 'sistema', 'Sistema', false, 'Ocorrência aberta pela loja • Canal: Telefone', 0),
    (19, 'POS-1004', 'atendente', 'Paula Rocha', true, 'Relato do cliente (registrado pela loja): Comprei o blazer há mais de 15 dias e ele ainda não chegou. O rastreio não anda.', 0),
    (20, 'POS-1004', 'atendente', 'Paula Rocha', true, 'Transportadora pediu prazo de 24h para localizar o pacote.', 40),
    (21, 'POS-1004', 'atendente', 'Paula Rocha', false, 'Oi, Thiago! Vamos investigar com a transportadora agora mesmo e te retorno ainda hoje.', 55),
    (22, 'POS-1004', 'atendente', 'Paula Rocha', false, 'A transportadora confirmou que o pacote foi extraviado. Pedimos desculpas! Você prefere o reenvio ou o estorno?', 1500),
    (23, 'POS-1004', 'cliente', NULL::text, false, 'Prefiro o estorno, já comprei em outro lugar.', 1620),
    (24, 'POS-1004', 'atendente', 'Paula Rocha', false, 'Combinado, vamos fazer o estorno total via PIX.', 1800),
    (25, 'POS-1004', 'sistema', 'Sistema', false, 'Chamado concluído com Estorno no valor de R$ 329.90. Comprovante: PIX-B41D08E5', 1830),
    (26, 'POS-1005', 'cliente', NULL::text, false, 'O vestido desbotou na primeira lavagem, seguindo a etiqueta direitinho.', 0),
    (27, 'POS-1005', 'atendente', 'Carlos Menezes', false, 'Olá, Patrícia! Vamos resolver. Você pode nos contar como lavou (água fria, à mão)?', 80),
    (28, 'POS-1005', 'cliente', NULL::text, false, 'Lavei à mão, com água fria e sabão neutro.', 240),
    (29, 'POS-1005', 'atendente', 'Carlos Menezes', false, 'Obrigada! Foi um lote com problema no tingimento. Vamos enviar outro vestido de lote diferente.', 1300),
    (30, 'POS-1005', 'sistema', 'Sistema', false, 'Chamado concluído com Reenvio. Código de rastreio: LB739406128BR', 1330),
    (31, 'POS-1006', 'cliente', NULL::text, false, 'O cinto é mais largo do que parecia nas fotos. Prefiro devolver.', 0),
    (32, 'POS-1006', 'atendente', 'Mariana Silva', false, 'Oi, Gustavo! Tudo bem, você está dentro do prazo. Pode enviar o cinto para o endereço da loja.', 120),
    (33, 'POS-1006', 'cliente', NULL::text, false, 'Enviei hoje. Obrigado!', 4300),
    (34, 'POS-1006', 'atendente', 'Mariana Silva', false, 'Cinto recebido! Fizemos o estorno de R$ 89,90 via PIX.', 8700),
    (35, 'POS-1006', 'sistema', 'Sistema', false, 'Chamado concluído com Estorno no valor de R$ 89.90. Comprovante: PIX-2C9E5A77', 8730),
    (36, 'POS-1007', 'cliente', NULL::text, false, 'Pedi o tênis 42 e veio 40, que apertou muito.', 0),
    (37, 'POS-1007', 'atendente', 'Paula Rocha', false, 'Olá, Eduardo! Peço desculpas pelo engano na separação. Vamos enviar o 42 e você devolve o 40 depois, tudo sem custo.', 30),
    (38, 'POS-1007', 'cliente', NULL::text, false, 'Ótimo, obrigado pela rapidez!', 300),
    (39, 'POS-1007', 'atendente', 'Paula Rocha', false, 'O tênis 42 foi postado hoje. Código de rastreio por e-mail.', 1700),
    (40, 'POS-1007', 'sistema', 'Sistema', false, 'Chamado concluído com Reenvio. Código de rastreio: OZ158372946BR', 1730),
    (41, 'POS-1008', 'cliente', NULL::text, false, 'A sandália era para um casamento no sábado e chegou só na segunda. Quero o dinheiro de volta.', 0),
    (42, 'POS-1008', 'atendente', 'Carlos Menezes', false, 'Oi, Juliana! Lamentamos muito o atraso, entendemos o transtorno. Vamos fazer o estorno integral, sem precisar devolver.', 65),
    (43, 'POS-1008', 'cliente', NULL::text, false, 'Obrigada pela compreensão.', 90),
    (44, 'POS-1008', 'atendente', 'Carlos Menezes', false, 'Estorno de R$ 199,90 realizado via PIX. O comprovante segue por e-mail.', 400),
    (45, 'POS-1008', 'sistema', 'Sistema', false, 'Chamado concluído com Estorno no valor de R$ 199.90. Comprovante: PIX-9D03F1AB', 430),
    (46, 'POS-1009', 'cliente', NULL::text, false, 'Uma das três regatas veio com o tecido furado na barra.', 0),
    (47, 'POS-1009', 'atendente', 'Mariana Silva', false, 'Olá, Felipe! Pode mandar uma foto da regata com defeito?', 50),
    (48, 'POS-1009', 'cliente', NULL::text, false, 'Enviei a foto agora.', 130),
    (49, 'POS-1009', 'atendente', 'Mariana Silva', true, 'Estoque confirmou 2 regatas M. Enviar com PAC para sair mais barato.', 130),
    (50, 'POS-1009', 'atendente', 'Mariana Silva', false, 'Recebemos, obrigada! Vamos reenviar a regata. Estamos preparando o envio.', 600),
    (51, 'POS-1010', 'sistema', 'Sistema', false, 'Ocorrência aberta pela loja • Canal: Instagram', 0),
    (52, 'POS-1010', 'atendente', 'Paula Rocha', true, 'Relato do cliente (registrado pela loja): Comprei sem ver que o tecido é sintético. Quero devolver e receber de volta.', 0),
    (53, 'POS-1010', 'atendente', 'Paula Rocha', false, 'Oi, Aline! Claro, está dentro do prazo. Envie o body de volta que seguimos com o estorno.', 110),
    (54, 'POS-1010', 'cliente', NULL::text, false, 'Já postei! Código MM456123789BR.', 2800),
    (55, 'POS-1010', 'atendente', 'Paula Rocha', false, 'Recebemos o body. Estamos preparando o estorno e te avisamos quando sair.', 6400),
    (56, 'POS-1011', 'cliente', NULL::text, false, 'A saia ficou grande na cintura. Pedi 38 mas preciso do 36.', 0),
    (57, 'POS-1011', 'atendente', 'Carlos Menezes', false, 'Olá, Bruna! Vamos trocar pelo 36. Para devolver, embale a peça na embalagem original, com a etiqueta, e envie para: Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000. A postagem é por nossa conta: é só pedir o código de coleta aqui.', 75),
    (58, 'POS-1011', 'cliente', NULL::text, false, 'Consigo postar amanhã. Quanto tempo leva depois?', 1700),
    (59, 'POS-1012', 'cliente', NULL::text, false, 'Mudei de ideia sobre o vestido. Posso devolver?', 0),
    (60, 'POS-1012', 'atendente', 'Mariana Silva', false, 'Oi, Renata! Pode sim. Para devolver, embale a peça na embalagem original, com a etiqueta, e envie para: Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000. A postagem é por nossa conta: é só pedir o código de coleta aqui.', 40),
    (61, 'POS-1012', 'cliente', NULL::text, false, 'Perfeito, vou levar nos Correios na sexta.', 900),
    (62, 'POS-1013', 'cliente', NULL::text, false, 'O botão da jaqueta caiu logo no primeiro dia de uso.', 0),
    (63, 'POS-1013', 'atendente', 'Paula Rocha', false, 'Olá, Vinícius! Estamos analisando o seu caso. Você consegue enviar uma foto da jaqueta?', 60),
    (64, 'POS-1013', 'atendente', 'Paula Rocha', true, 'Cliente comentou no Instagram. Priorizar a resposta.', 75),
    (65, 'POS-1013', 'cliente', NULL::text, false, 'Segue a foto. Ainda não tive retorno, alguma novidade?', 1900),
    (66, 'POS-1014', 'cliente', NULL::text, false, 'Já passou do prazo de entrega da blusa e o rastreio está parado em São Paulo.', 0),
    (67, 'POS-1014', 'atendente', 'Carlos Menezes', false, 'Oi, Daniela! Já abrimos um chamado com a transportadora e voltamos com o retorno em até 2 dias úteis.', 35),
    (68, 'POS-1015', 'sistema', 'Sistema', false, 'Ocorrência aberta pela loja • Canal: E-mail', 0),
    (69, 'POS-1015', 'atendente', 'Mariana Silva', true, 'Relato do cliente (registrado pela loja): A calça 40 ficou apertada no quadril, preciso do 42.', 0),
    (70, 'POS-1015', 'atendente', 'Mariana Silva', false, 'Olá, Ana! Vamos verificar se temos o 42 em estoque para troca e já retornamos.', 1000),
    (71, 'POS-1015', 'cliente', NULL::text, false, 'Combinado, fico no aguardo!', 1300),
    (72, 'POS-1016', 'cliente', NULL::text, false, 'A camisa veio com uma mancha de tinta no punho.', 0),
    (73, 'POS-1016', 'atendente', 'Paula Rocha', false, 'Oi, Julia! Sentimos muito. Para devolver, embale a peça na embalagem original, com a etiqueta, e envie para: Mariana Modas - Rua das Flores, 120, Centro, Sorocaba/SP, CEP 18010-000. A postagem é por nossa conta: é só pedir o código de coleta aqui.', 90),
    (74, 'POS-1016', 'cliente', NULL::text, false, 'Postei hoje! Posso mandar o comprovante de postagem?', 2200),
    (75, 'POS-1017', 'cliente', NULL::text, false, 'O zíper do vestido emperra e não fecha até o final.', 0),
    (76, 'POS-1017', 'atendente', 'Carlos Menezes', false, 'Olá, Carla! Vamos trocar o vestido por um novo. Pode confirmar o endereço de entrega?', 25),
    (77, 'POS-1017', 'cliente', NULL::text, false, 'É o mesmo do pedido, Rua das Acácias, 45.', 80),
    (78, 'POS-1017', 'atendente', 'Carlos Menezes', true, 'Zíper do mesmo lote em outras 2 peças. Avisar o fornecedor.', 160),
    (79, 'POS-1017', 'atendente', 'Carlos Menezes', false, 'Confirmado! Já estamos separando o novo vestido para envio.', 500),
    (80, 'POS-1018', 'cliente', NULL::text, false, 'Os lenços chegaram depois do aniversário que eu ia presentear. Quero o estorno.', 0),
    (81, 'POS-1018', 'atendente', 'Mariana Silva', false, 'Oi, Patrícia! Entendemos, desculpe o atraso. Vamos fazer o estorno dos dois lenços.', 95),
    (82, 'POS-1018', 'cliente', NULL::text, false, 'Obrigada! Posso receber via PIX?', 200),
    (83, 'POS-1018', 'atendente', 'Mariana Silva', false, 'Pode sim! Já estamos preparando o estorno via PIX.', 260),
    (84, 'POS-1019', 'cliente', NULL::text, false, 'A sandália 37 ficou pequena, parece que a numeração é menor.', 0),
    (85, 'POS-1020', 'cliente', NULL::text, false, 'O short desfiou na barra depois de uma lavada.', 0),
    (86, 'POS-1021', 'cliente', NULL::text, false, 'Os bodies não são do jeito que eu esperava. Gostaria de devolver.', 0),
    (87, 'POS-1021', 'atendente', 'Mariana Silva', false, 'Olá, Beatriz! Recebemos seu pedido e já estamos analisando. Amanhã cedo te passamos as orientações de devolução.', 30),
    (88, 'POS-1021', 'cliente', NULL::text, false, 'Tá bom, obrigada!', 45),
    (89, 'POS-1022', 'cliente', NULL::text, false, 'O zíper do vestido quebrou na primeira vez que usei. Segue a foto.', 0),
    (90, 'POS-1023', 'cliente', NULL::text, false, 'O vaso chegou trincado na base.', 0),
    (91, 'POS-1023', 'atendente', 'Ana Paula Ribeiro', false, 'Olá, Otávio! Sinto muito. Vamos reenviar um vaso novo, embalado com mais proteção.', 60),
    (92, 'POS-1023', 'atendente', 'Ana Paula Ribeiro', false, 'Vaso novo postado! O código de rastreio já está no seu e-mail.', 2500),
    (93, 'POS-1023', 'sistema', 'Sistema', false, 'Chamado concluído com Reenvio. Código de rastreio: RK294851736BR', 2530),
    (94, 'POS-1024', 'cliente', NULL::text, false, 'O jogo de pratos ainda não chegou e o prazo acabou ontem.', 0),
    (95, 'POS-1024', 'atendente', 'Ana Paula Ribeiro', false, 'Oi, Lúcia! Estamos conferindo a entrega com a transportadora e já te respondemos.', 120),
    (96, 'POS-1025', 'cliente', NULL::text, false, 'O tapete é bem menor do que 1,20m, parece uns 90cm.', 0),
    (97, 'POS-1026', 'cliente', NULL::text, false, 'Faltaram peças no kit de jardim vertical e não consigo montar.', 0),
    (98, 'POS-1026', 'atendente', 'Fernando Lima', false, 'Olá, Mônica! Lamentamos. Como não temos as peças para reposição, vamos seguir com o estorno.', 80),
    (99, 'POS-1026', 'cliente', NULL::text, false, 'Tudo bem, pode ser o estorno.', 150),
    (100, 'POS-1027', 'cliente', NULL::text, false, 'A planta ainda não chegou e o prazo de entrega já venceu.', 0)
) AS v(ordem, protocolo, autor, autor_nome, interna, texto, minutos)
JOIN ocorrencias o ON o.protocolo = v.protocolo
JOIN pedidos p ON p.id = o.pedido_id
ORDER BY v.ordem;

-- data de conclusao = momento do evento final de cada caso concluido
UPDATE ocorrencias o SET concluido_em = (SELECT MAX(m.enviado_em) FROM mensagens m WHERE m.ocorrencia_id = o.id AND m.autor = 'sistema')
WHERE o.status = 'Concluído';

COMMIT;

-- ---------------------------------------------------------------- RESUMO
SELECT 'lojas' AS tabela, COUNT(*) AS total FROM lojas
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'ocorrencias', COUNT(*) FROM ocorrencias
UNION ALL SELECT 'mensagens', COUNT(*) FROM mensagens;

SELECT l.nome AS loja, o.status, COUNT(*) AS ocorrencias
FROM ocorrencias o JOIN lojas l ON l.id = o.loja_id
GROUP BY l.nome, o.status
ORDER BY l.nome, o.status;
