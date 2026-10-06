# PosTec — Contrato de Rotas da API (Simplificado)
**Base URL:** `http://localhost:3333/api`  
*Fácil de entender e direto ao ponto: IDs simples inteiros (1, 2, 3), poucas rotas e respostas claras.*

---

## 1. Portal do Cliente (Rotas Públicas)

### 1.1 Consultar Pedido
Cliente digita o número do pedido e o CPF na tela da loja.
- **`POST`** `/api/portal/:slug/consultar-pedido`
- **Body:**
```json
{
  "numero_pedido": "PED-101",
  "cpf": "12345678901"
}
```
- **Resposta (200):**
```json
{
  "pedido_id": 1,
  "numero_pedido": "PED-101",
  "cliente_nome": "Lucas Avaliador",
  "cliente_email": "lucas.avaliador@facens.br",
  "produto": "Vestido Midi Linho Cru - Tam M",
  "valor": 189.90
}
```

---

### 1.2 Abrir Ocorrência
Cria a ocorrência no banco e dispara o e-mail via Resend.
- **`POST`** `/api/portal/:slug/ocorrencias`
- **Body:**
```json
{
  "pedido_id": 1,
  "motivo": "Produto com Defeito",
  "descricao": "O vestido veio com o zíper quebrado."
}
```
- **Resposta (201):**
```json
{
  "protocolo": "POS-1001",
  "mensagem": "Ocorrência aberta com sucesso! Enviamos a confirmação para seu e-mail."
}
```

---

### 1.3 Ver Status da Ocorrência
O cliente consulta o andamento usando o número do protocolo.
- **`GET`** `/api/portal/:slug/ocorrencias/:protocolo`
- **Resposta (200):**
```json
{
  "protocolo": "POS-1001",
  "status": "Reenvio Solicitado",
  "motivo": "Produto com Defeito",
  "codigo_rastreio": "AA987654321BR",
  "valor_estorno": null,
  "mensagens": [
    { "autor": "cliente", "texto": "O vestido veio com defeito." },
    { "autor": "atendente", "texto": "Olá Lucas! Já despachamos uma nova peça para você." }
  ]
}
```

---

## 2. Painel da Loja (Rotas do Lojista / Atendente)

### 2.1 Login
- **`POST`** `/api/auth/login`
- **Body:**
```json
{
  "email": "mariana@marianamodas.com.br",
  "senha": "admin123"
}
```
- **Resposta (200):**
```json
{
  "token": "eyJhbGciOiJI...",
  "usuario": {
    "id": 1,
    "nome": "Mariana Silva",
    "role": "admin",
    "loja_id": 1,
    "loja_nome": "Mariana Modas"
  }
}
```

---

### 2.2 Listar Ocorrências (Para a tabela ou Kanban)
- **`GET`** `/api/painel/ocorrencias`
- **Resposta (200):**
```json
[
  {
    "id": 1,
    "protocolo": "POS-1001",
    "status": "Novo",
    "motivo": "Produto com Defeito",
    "cliente_nome": "Lucas Avaliador",
    "numero_pedido": "PED-101",
    "produto": "Vestido Midi Linho Cru - Tam M",
    "criado_em": "2026-10-06T13:30:00Z"
  }
]
```

---

### 2.3 Mudar Status da Ocorrência
- **`PATCH`** `/api/painel/ocorrencias/:id/status`
- **Body:**
```json
{
  "status": "Aguardando Devolução"
}
```

---

### 2.4 Resolver Ocorrência (Reenvio ou Estorno)
Gera a resolução final e dispara o e-mail de conclusão para o cliente.
- **`POST`** `/api/painel/ocorrencias/:id/resolver`

**Se for Reenvio:**
```json
{
  "tipo_resolucao": "Reenvio",
  "codigo_rastreio": "AA987654321BR"
}
```

**Se for Estorno:**
```json
{
  "tipo_resolucao": "Estorno",
  "valor_estorno": 189.90,
  "comprovante_estorno": "PIX-123456"
}
```
