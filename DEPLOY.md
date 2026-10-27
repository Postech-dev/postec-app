# VPS

Com Docker e Compose instalados, execute na raiz do projeto:

```sh
docker compose up -d --build
```

Acesse `http://IP_DA_VPS`. Libere a porta TCP 80 no firewall. A landing page não é incluída.

O Compose usa o `backend/.env` existente para credenciais do banco e integrações, sem modificá-lo. Esse arquivo precisa estar presente na VPS. A conexão interna usa o serviço `database`; o banco e o backend não expõem portas públicas. Migrações são executadas antes da API, sem seeds.

Para HTTPS, aponte um domínio à VPS, libere TCP 80/443 e execute `APP_DOMAIN=app.seudominio.com.br docker compose up -d --build`. Configure a URL pública da integração para esse domínio no ambiente da VPS quando usar Nuvemshop.

Preserve o volume do banco e a chave de criptografia existente. Um banco já criado precisa das mesmas credenciais que estavam em uso; variáveis não alteram sua senha. Não execute `docker compose down -v`.

Backup antes de atualizar:

```sh
docker compose exec -T database sh -c 'pg_dump -U "$DB_USER" -d "$DB_NAME"' > backup.sql
```

Guarde os backups fora da VPS. Para atualizar, faça backup, atualize o código e repita o comando de subida.
