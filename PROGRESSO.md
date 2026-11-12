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

## Última alteração (em publicação)

Troca das superfícies escuras (grafite `#0b1220`) por **azul profundo** (`#0d3260 → #071b33`):
sidebar, topbar avatar, hero do painel, cartões escuros de KPI/orçamentos e cabeçalho dos documentos.
Paleta mantida: azul + esmeralda + teal. Textos secundários em `blue-100/60`.

## Pendências / próximos passos

1. **Confirmar deploy** da troca de cores e revisar no navegador.
2. **Logo oficial** no cabeçalho dos documentos — hoje é o monograma "AT".
   Preencher `Configurações → Logo (URL)` em `company_settings.logo_url`.
3. **Importação de orçamento de fornecedor**: hoje aceita texto `descrição;qtd;valor`.
   Avaliar upload de PDF/imagem com OCR e/ou CSV.
4. **Markup padrão** salvo nas Configurações (hoje o campo inicia em 30% na tela).
5. Completar telefone/e-mail dos clientes vindos de NF-e (campos ficaram vazios).
6. Possível evolução: gráficos no painel, cards em vez de tabela em algumas listas.

## Observações técnicas

- `orders.number` é serial; `order_items.total_price` é coluna gerada (`quantity * unit_price`).
- Totais das OS não são persistidos; são calculados a partir dos itens.
- Serviços dos orçamentos da Orizon foram rateados para preservar o total original (nota em `orders.notes`).
- Rotas de impressão ficam fora do shell: `/ordens/:id/imprimir` e `/recibos/:id/imprimir`.
- CSS de impressão em `src/index.css` (`@page A4`, `print-color-adjust: exact`).
- Sempre validar com `npm run lint` e `npm run build` antes de publicar.
