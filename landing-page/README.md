# PosTec — Landing page

Landing page de apresentação da PosTec, baseada na documentação Project One fornecida em 16/10/2026. A proposta é organizar o pós-venda de pequenos e-commerces: pedidos, ocorrências, atendimento, reenvio ou estorno e resolução.

Produção: https://landing-page-delta-umber-19.vercel.app

## Conteúdo e identidade

- Marca original fornecida pelo usuário em `public/brand/postec-original.jpeg`, exibida com recorte SVG sem alterar o arquivo original.
- Identidade preta, branca e laranja, com fontes Manrope e DM Sans hospedadas no próprio site.
- Texto e planos baseados em `Documentacao_PosTec_ProjectOne.docx`. O documento interno não é publicado.
- Integrações, funcionalidades e valores são apresentados como previstos, pois o projeto está em desenvolvimento e validação.
- Demonstração interativa com dados fictícios, sem conexão com lojas reais. Permite selecionar casos, simular reenvio/estorno, concluir e reiniciar o fluxo.
- Contato: `suporte@postec.com`, informado pelo usuário. Os CTAs abrem o aplicativo de e-mail; não há formulário nem envio automático.

## Desenvolvimento

```sh
cd landing-page
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm run preview
```

Astro com saída estática, TypeScript e Tailwind via Vite. JavaScript limitado ao menu móvel e à demonstração. FAQ usa `details/summary` nativos.

## Arquivos principais

- `src/data/site.ts`: metadados, contato, integrações, planos e FAQ.
- `src/pages/index.astro`: conteúdo e composição da landing page.
- `src/components/ProductDemo.astro`: interface ilustrativa e interação do fluxo.
- `src/components/Brand.astro`: aplicação da marca fornecida.
- `src/components/Icon.astro`: ícones vetoriais.
- `src/styles/global.css`: estilos e ajustes responsivos.
- `src/layouts/Layout.astro`: HTML semântico e metadados sociais.

## Publicação na Vercel

A pasta está vinculada ao projeto `landing-page`. O `vercel.json` define Astro, build `npm run build` e saída `dist/`. O vínculo local em `.vercel/` é ignorado pelo Git.

```sh
vercel deploy --prod
```

Deploy manual pela CLI; não há integração automática com Git configurada.

## Cloudflare como alternativa

A configuração anterior em `wrangler.jsonc` foi preservada. `npm run deploy` executa o build e publica na Cloudflare, caso a CLI Wrangler esteja autenticada. Para a hospedagem atual na Vercel, usar o comando acima.
