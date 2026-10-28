# Publicação na Vercel e no Supabase

Aplicação publicada: https://postec-app.vercel.app

A aplicação usa um projeto Vercel com o React estático e uma função Express em `/api`. A landing page continua no projeto independente `landing-page`.

## Banco

O projeto Supabase vinculado é `idjfmchqhtyykqmmjnso`, na região `us-east-1` (Virgínia). A função Vercel usa `iad1`, próxima ao banco. Desative a Data API: os dados passam pela API Express, que usa o login e o JWT existentes. As migrações também habilitam RLS em todas as tabelas, sem políticas públicas.

Em **Connect**, selecione **Session pooler**, porta **5432**. O worker usa locks por sessão: o Transaction pooler na porta 6543 não é compatível com essa implementação. Use a senha codificada como componente de URL quando contiver caracteres especiais. Acrescente `?sslmode=verify-full` à URI e configure `DATABASE_SSL_CA` com o PEM da autoridade certificadora baixado da configuração SSL do Supabase. A conexão valida o certificado e o hostname. Em arquivos `.env`, o PEM pode usar `\n` entre as linhas, dentro de aspas duplas.

Preencha `backend/.env.production`, ignorado pelo Git. `DATABASE_URL` contém a conexão; `DIRECT_URL` é opcional para migrações e deve ser uma conexão direta ou Session pooler. Preserve os segredos gerados em local seguro.

Para criar um banco vazio, execute na raiz:

```sh
node --env-file=backend/.env.production backend/scripts/migrate.cjs --init
```

Esse comando cria o schema e aplica as migrações, sem importar lojas, usuários ou pedidos de teste. Para atualizações futuras, use o mesmo comando sem `--init`. Não execute `database/db.sql`, `testes.sql` ou `seed.js` em produção.

## CLI autenticada e usuário dedicado

O repositório também pode ser vinculado com `npx supabase link --project-ref idjfmchqhtyykqmmjnso`. A CLI autenticada permite aplicar SQL via Management API com `npx supabase db query --linked --file ARQUIVO.sql`, sem fornecer a senha administrativa.

Em produção, prefira um login `postec_backend` com senha aleatória própria, sem privilégios administrativos. Após criar esse login e aplicar o schema e as migrações como `postgres`, execute `backend/database/supabase-access.sql`: ele libera somente as tabelas e sequências da aplicação para esse login e cria políticas RLS restritas a ele. A API continua responsável pela autorização por loja. Os papéis públicos do Supabase não recebem essas políticas.

Na URI do Session pooler, use `postec_backend.PROJECT_REF` como usuário e a senha desse login. A senha administrativa criada no painel permanece independente. As migrações e a configuração do Cron devem rodar pela CLI autenticada ou por uma `DIRECT_URL` administrativa; o usuário da aplicação não pode alterar o schema.

## Vercel

O projeto Vercel deve usar a raiz do repositório, framework **Other**, Node **24.x**. `vercel.json` define os comandos e as rotas. A instalação usa o `package-lock.json` da raiz e os workspaces `backend` e `frontend`.

Cadastre as variáveis do arquivo de produção no ambiente **Production** da Vercel:

- `DATABASE_URL`, `DATABASE_SSL_CA`, `JWT_SECRET` (ao menos 32 caracteres), `INTEGRATION_ENCRYPTION_KEY`, `CRON_SECRET`.
- `APP_PUBLIC_URL` e `CORS_ORIGIN`: origem HTTPS atribuída à aplicação.
- `DB_POOL_MAX=3`.
- Quando usadas, as credenciais `NUVEMSHOP_APP_ID`, `NUVEMSHOP_CLIENT_SECRET`, `NUVEMSHOP_USER_AGENT`, `RESEND_API_KEY` e `RESEND_FROM_EMAIL`.

Não envie `DIRECT_URL` ao frontend nem prefixe segredos com `VITE_`. O frontend usa `/api` no mesmo domínio.

```sh
vercel link --yes --project postec-app
vercel deploy --prod
```

Se criar o projeto pela CLI e a detecção automática de múltiplos serviços conflitar com a configuração, execute primeiro `vercel project add postec-app`, depois o comando de vínculo.

As migrações são executadas separadamente antes da publicação. O build não acessa nem modifica o banco. Para previews com acesso a dados, configure um banco de homologação e segredos próprios no ambiente Preview.

## Fila Nuvemshop

Na Vercel, a API não inicia o temporizador do servidor local. O endpoint protegido `/api/internal/nuvemshop-worker` agenda reconciliações e processa tarefas da fila. Configure uma chamada por minuto pelo Supabase Cron depois de publicar:

```sh
node --env-file=backend/.env.production backend/scripts/configure-cron.cjs
```

O script habilita `pg_cron` e `pg_net`, guarda URL e segredo no Supabase Vault e cria/atualiza o job `postec-nuvemshop-worker`. A ausência das credenciais da Nuvemshop deixa o endpoint em `not_configured`, sem processar tarefas. Ao ativar a integração, registre na Nuvemshop o callback e o webhook HTTPS da aplicação.

## Verificação

Execute `npm run build`, `npm test` e `npm run test:integration --workspace backend` (este último exige Docker). Depois do deploy, confira:

- `/login` e uma rota interna carregam a aplicação.
- `/api/health` retorna `{"status":"ok","database":"ok"}`.
- O worker sem autenticação retorna 401.
- Cadastro, login e consulta autenticada da loja funcionam com o banco remoto.
- O job do Supabase Cron recebe respostas HTTP 200.

Referências: [funções e pool de conexões Vercel](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package), [conexões Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [agendamento e Vault](https://supabase.com/docs/guides/functions/schedule-functions).
