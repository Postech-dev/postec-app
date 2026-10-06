# PosTec — Documentação Técnica e de Produto do MVP
**Disciplina:** Startup Project: One — Facens (ADS, 4º Semestre)  
**Projeto:** PosTec (SaaS de Pós-Venda para Pequenos e Médios E-commerces)  

---

Esta pasta reúne toda a especificação oficial do projeto, dividida estrategicamente para que cada integrante do grupo consiga trabalhar sem bloqueios:

| Arquivo | Descrição | Destinatário Principal |
| :--- | :--- | :--- |
| 📄 [`01-escopo-mvp.md`](./01-escopo-mvp.md) | Definição completa do MVP (Dentro vs. Fora), máquina de estados, validação com lojistas, roteiro da demo na banca e divisão das 6 pessoas. | **Toda a Equipe, Professor e Gestão** |
| 🗄️ [`02-database-schema.sql`](./02-database-schema.sql) | Script SQL DDL executável para PostgreSQL com extensão UUID, tabelas de lojas, usuários, pedidos simulados, ocorrências e mensagens, já incluindo dados de teste (SEED). | **Pessoa de Banco de Dados & Dev Back-end** |
| 🔌 [`03-api-contract.md`](./03-api-contract.md) | Contrato de rotas REST, payloads de entrada/saída (JSONs) para o Portal do Cliente e Painel do Lojista, além dos gatilhos para o Resend. | **André (Back) & Luiz (Front)** |

---

## Como iniciar o ambiente local

1. **Subir o Banco de Dados (Docker):**
   ```bash
   docker run --name postec-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postec_db -p 5432:5432 -d postgres:16-alpine
   ```
2. **Executar o script SQL inicial:**
   - Execute o script [`02-database-schema.sql`](./02-database-schema.sql) usando seu gerenciador de banco preferido (DBeaver, pgAdmin ou `psql`).
3. **Rodar o Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
