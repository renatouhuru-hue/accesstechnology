# Accesstechnology — OS / Orçamentos

## Estado atual

- **App em produção:** https://accesstechnology.vercel.app
- **Código:** https://github.com/renatouhuru-hue/accesstechnology (branch `main`)
- **Projeto local:** `D:\os-accesstechnology`
- **Supabase:** projeto `fqmvpfpepuduifkzgdnd` (URL e chave publicável em `src/config/runtime.ts` / env da Vercel)
- **IA:** Groq (`openai/gpt-oss-20b`); chave somente em `.env.local` e env vars da Vercel (nunca no Git)

## Stack

Vite + React 19 + TypeScript + Tailwind 4 + `@supabase/supabase-js` + lucide-react.
Build em `dist`. Deploy: `npx vercel --prod --yes` (token da CLI em `%APPDATA%\com.vercel.cli\Data\auth.json`).

## Módulos prontos

Painel, Clientes, Catálogo, Orçamentos/OS (editor + importação com markup), Agenda,
Recibos, Financeiro, Assistente IA, Configurações e documentos imprimíveis
(orçamento/OS e recibo, com valor por extenso).

## Dados já cadastrados

Clientes (6):

1. PLANO VIDA SAUDE SERVICOS ODONTOLOGICOS LTDA — 04.430.627/0001-33
2. INSTITUTO URO-NEFRO-ANDROLOGICO LTDA — 06.290.143/0001-61
3. ROSARIO DO CATETE AMBIENTAL SOCIEDADE ANONIMA (Orizon Rosário do Catete) — 43.061.782/0001-81
4. UNIDADE CARDIOTORACICA DE SERGIPE LTDA — 15.610.595/0001-74
5. ORAL SANTA HELENA — contato Marcos Rogério
6. ORIZON SOCORRO — contato Luciano Reis / Diego

Orçamentos/OS:

- #1 Orizon Socorro — UPGRADE BALANÇA — R$ 13.175,00 (14 itens)
- #2 Orizon Socorro — UPGRADE CFTV GALPÃO — R$ 12.514,00 (15 itens)
- #3 Oral Santa Helena — PONTO DE REDE — R$ 335,00
- #4 Oral Santa Helena — MANUTENÇÃO DESKTOP — R$ 400,00
- #5 Orizon Socorro — UPGRADE BALANÇA + CFTV GALPÃO (união de #1 e #2) — R$ 25.689,00 (29 itens, `enviado`)

## Alterações recentes

- **Senha de acesso** (HTTP Basic Auth via `proxy.ts`) — site inteiro protegido.
- Troca das superfícies escuras (grafite `#0b1220`) por **azul profundo** (`#0d3260 → #071b33`):
sidebar, topbar avatar, hero do painel, cartões escuros de KPI/orçamentos e cabeçalho dos documentos.
Paleta mantida: azul + esmeralda + teal. Textos secundários em `blue-100/60`.

## Acesso ao site (senha)

O site inteiro é protegido por **HTTP Basic Auth** via Routing Middleware da Vercel (`proxy.ts` + `proxy` em `vercel.json`),
o que inclui HTML, JS/CSS e as rotas de impressão.

- **Usuário:** `acesso`
- **Senha:** definida na variável de ambiente `APP_PASSWORD` (Vercel → Settings → Environment Variables)
- Sem credenciais o servidor responde `401` com `WWW-Authenticate: Basic realm="Accesstechnology"`.

Para trocar a senha: Vercel → Project → Settings → Environment Variables → editar `APP_PASSWORD` → Redeploy
(ou `npx vercel env rm APP_PASSWORD production` e `npx vercel env add APP_PASSWORD production`).

## Pendências / próximos passos

1. **Logo oficial** no cabeçalho dos documentos — hoje é o monograma "AT".
   Preencher `Configurações → Logo (URL)` em `company_settings.logo_url`.
2. **Importação de orçamento de fornecedor**: hoje aceita texto `descrição;qtd;valor`.
   Avaliar upload de PDF/imagem com OCR e/ou CSV.
3. **Markup padrão** salvo nas Configurações (hoje o campo inicia em 30% na tela).
4. Completar telefone/e-mail dos clientes vindos de NF-e (campos ficaram vazios).
5. Possível evolução: gráficos no painel, cards em vez de tabela em algumas listas.

## Observações técnicas

- `orders.number` é serial; `order_items.total_price` é coluna gerada (`quantity * unit_price`).
- Totais das OS não são persistidos; são calculados a partir dos itens.
- Serviços dos orçamentos da Orizon foram rateados para preservar o total original (nota em `orders.notes`).
- Rotas de impressão ficam fora do shell: `/ordens/:id/imprimir` e `/recibos/:id/imprimir`.
- CSS de impressão em `src/index.css` (`@page A4`, `print-color-adjust: exact`).
- Middleware de senha em `proxy.ts` (usa `next()` de `@vercel/functions`); declarado em `vercel.json` → `proxy.entrypoint`.
- A senha protege o site, não o banco: as políticas RLS do Supabase seguem acessíveis com a chave publicável.
- Sempre validar com `npm run lint` e `npm run build` antes de publicar.
