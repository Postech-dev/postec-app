-- O mesmo login não pode ser cadastrado em lojas diferentes mudando apenas maiúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_unique ON usuarios (lower(email));
