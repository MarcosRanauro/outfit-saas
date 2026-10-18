# Outfit SaaS — Project Memory

App de outfits multi-usuário. Cada pessoa cadastra suas peças, monta combinações e recebe sugestões de IA baseadas no clima e na ocasião.

## Stack

- **Framework:** Next.js 16.2.4 (App Router) + TypeScript
- **Node.js:** v20.20.2 (obrigatório — Next.js 16 exige >=20.9.0)
- **Estilo:** Tailwind v4 (via `@import`) + CSS customizado em arquivos por página
- **Banco:** Supabase (PostgreSQL, região São Paulo)
- **Auth:** Supabase Auth (email/senha com confirmação + Google OAuth); SMTP próprio via Resend (`noreply@miaoutfitai.com.br`)
- **Storage:** Supabase Storage — buckets `pieces` e `avatars`
- **IA:** Anthropic API, modelo `claude-sonnet-4-6`
- **Imagens de estúdio:** FASHN.ai (modelo humano / try-on), Photoroom (manequim fantasma); Remove.bg mantido comentado
- **Moderação:** OpenAI Moderation API (`omni-moderation-latest`), fail-closed
- **Clima:** Open-Meteo (gratuito, sem API key)
- **Geolocalização:** browser API + Nominatim (nome da cidade)
- **Deploy:** Vercel — miaoutfitai.com.br (DNS na Cloudflare; e-mail `contato@`/`suporte@` via Cloudflare Email Routing → Gmail)
- **Pagamentos:** Stripe (live)
- **Observabilidade:** Sentry (`@sentry/nextjs`, ativo só com `NEXT_PUBLIC_SENTRY_DSN`)
- **Testes/CI:** Vitest + GitHub Actions (lint + test + build)

## Mapa do código

```
src/
├── app/
│   ├── (auth)/                     # login, cadastro, esqueci-senha
│   ├── (dashboard)/
│   │   ├── layout.tsx              # bottom nav + proteção de rota
│   │   ├── closet/                 # page.tsx (grid), [id]/ (detalhe), nova-peca/
│   │   ├── lookbook/               # page.tsx + [id]/ (detalhe do outfit)
│   │   ├── mia/page.tsx            # chat com a Mia (inclui wishlist)
│   │   ├── outfit-ia/page.tsx      # só redireciona para /mia
│   │   └── perfil/page.tsx         # perfil, plano, avatar crop
│   ├── api/
│   │   ├── account/                # DELETE: apagar conta (LGPD)
│   │   ├── mia/                    # chat, extract-date
│   │   ├── outfit/generate/        # geração de outfits
│   │   ├── pieces/                 # analyze, describe, moderate, studio (FASHN), ghost-mannequin (Photoroom)
│   │   ├── tryon/                  # FASHN try-on + status (ownership)
│   │   ├── wishlist/generate/
│   │   ├── stripe/                 # checkout, portal, webhook
│   │   ├── cron/trial-reminder/    # cron Vercel (vercel.json) — protegido por CRON_SECRET
│   │   └── weather/route.ts        # Open-Meteo
│   ├── auth/                       # callback (OAuth/confirmação de e-mail), reset-password
│   ├── landing, sobre, faq, termos, privacidade, offline  # páginas públicas
│   ├── layout.tsx, page.tsx        # page.tsx redireciona (logado → /closet, não → /login)
│   └── *.css                       # um por área (auth, dashboard, closet, lookbook, mia, perfil, wishlist, landing, faq…)
├── components/                     # closet/, layout/ (BottomNav, DashboardTopBanner), lookbook/, studio/, ui/ (AvatarCrop, TrialExpiredModal, ModeToggle)
├── lib/
│   ├── supabase/client.ts, server.ts, admin.ts   # admin = service role, só no servidor
│   ├── rate-limit.ts, plan-limits.ts, pricing.ts   # limites por plano; preço do Pro em `pricing.ts`
│   ├── api-schemas.ts, parse-request-body.ts       # Zod nos bodies das rotas
│   ├── email.ts, email-templates.ts, trial-reminder.ts   # e-mails transacionais (Resend)
│   └── moderation-server.ts, image.ts, piece-photos.ts
├── types/database.ts               # gerado pelo Supabase — não editar à mão
├── types/app.ts                    # tipos manuais (Plan, Profile, Piece, PiecePhoto…)
└── middleware.ts                   # proteção de rotas (⚠ deprecado no Next.js 16 — renomear para proxy)
```

## Banco de dados

- `profiles` — id, name, height, weight, style, avatar_url, plan (`free` | `pro`), closet_tour_completed, stripe_customer_id, stripe_subscription_id, plan_expires_at, usage_mia_generations, usage_outfit_generations, usage_pieces_analyzed, usage_wishlist_generations, usage_studio_generations, usage_model_generations, usage_reset_at, trial_ends_at, created_at, updated_at
- `pieces` — id, user_id, code, name, category, color, brand, photo_url, fit, style_type, season, created_at
- `outfits` — id, user_id, name, subtitle, style_tags[], occasion_tags[], period, occasion, why, pieces (IDs[]), notes, created_at
- `outfit_history` — id, user_id, outfit_id, worn_at, occasion, created_at
- `wishlist_items` — id, user_id, name, category, color, reason, priority (`high` | `medium` | `low`), purchased, created_at
- `piece_photos` — múltiplas fotos por peça (is_cover, is_studio); `pieces.photo_url` fica em sincronia com a capa
- `tryon_predictions` — id, user_id, prediction_id (unique), piece_id, status, created_at (valida ownership no `/api/tryon/status`). **Migration 0001 ainda não aplicada em produção — tabela não existe no banco**
- Migrations em `supabase/migrations/` (0001–0005) são aplicadas **à mão via SQL**; o histórico do Supabase está dessincronizado. `supabase/schema.sql` é o dump de referência
- Funções `handle_new_user` e `set_trial_on_signup` (triggers) não são executáveis via API; `increment_usage` só por `authenticated`
- Trigger `on_auth_user_created` cria perfil automaticamente no signup
- **RLS ativado em todas as tabelas** — toda query precisa respeitar `auth.uid()`

## Identidade visual (não negociável)

- **Tema:** dark premium, preto com acento dourado/cobre
- **Cores:**
  - Fundo: `#080808`
  - Card: `#111111`
  - Acento: `rgba(180, 140, 60, 1)` (dourado)
  - Erro: borda `rgba(224,92,92,0.3)`, texto `rgba(224,92,92,0.8)`
- **Fontes:** Inter (corpo), Bebas Neue (títulos)
- **Mobile first** em todos os componentes — desktop é adaptação
- Tailwind v4 fica para utilitários; estilos visuais ficam em `.css` por página
- **Inputs sempre `font-size: 16px`** — qualquer valor menor causa zoom automático no iOS

## Regras de produto

- IA gera **5 outfits por vez**; o usuário salva os que gostar (não salva tudo)
- Outfits salvos vão pro Lookbook, filtráveis por período e ocasião
- Storage de fotos é **público** (URLs diretas, sem signed URLs)
- Fotos de peças ficam organizadas por `user_id` no bucket (`pieces/`)
- Avatares ficam em `avatars/{user_id}/avatar.jpg`
- Modelo Anthropic é fixo em `claude-sonnet-4-6` — não trocar sem decisão
- Closet exibe modal de onboarding quando perfil está incompleto (sem height, weight ou style)
- Erro de closet vazio na Outfit IA exibe card na tela com link para /closet (não só no console)

## Planos

| Plano | Preço | Limite |
|---|---|---|
| Free | R$ 0 | Mia 10, outfits 5, análise de peça 3, wishlist 3 por mês; sem estúdio |
| Pro | R$ 24,90/mês | Mia/outfits/análise/wishlist ilimitados; modelo humano 10/mês; manequim 50/mês |

Limites em `src/lib/plan-limits.ts`; preço em `src/lib/pricing.ts` (`PRO_VALOR`).

- **Só existem os planos `free` e `pro`.** O plano `stylist` foi descontinuado e removido do código (tipos, rate limit, webhook).
- **Trial de 15 dias** (`trial_ends_at`): durante o trial o acesso é ilimitado, **exceto modelo humano e manequim, que seguem limitados mesmo no trial** (custo por geração). Ao expirar, usuário `free` é **bloqueado** nas rotas de IA (HTTP 403, `code: TRIAL_EXPIRED`) e o frontend abre o `TrialExpiredModal` pedindo upgrade. Limite de plano atingido (free sem trial) retorna HTTP 429, `code: RATE_LIMITED`.

## Convenções de código

- **App Router**, nunca Pages Router
- **Server Components por padrão**; só usar `"use client"` quando precisar de hooks ou eventos
- Toda query Supabase no server usa `createClient()` de `lib/supabase/server.ts`
- Toda query Supabase no client usa `createClient()` de `lib/supabase/client.ts`
- Tipos do banco em `types/database.ts` — atualizar sempre que rodar migration
- Imports absolutos com `@/` (configurado no `tsconfig`)
- CSS por página: `nome-da-pagina.css` na pasta `app/`, importado direto no layout/page

## Comandos

```bash
# Subir servidor (exige Node 20 no PATH)
PATH="/home/marcos-ranauro/.nvm/versions/node/v20.20.2/bin:$PATH" npm run dev

npm run build            # build de produção
npm run lint             # ESLint
npx supabase gen types typescript --linked > src/types/database.ts  # regenerar tipos
```

## Decisões já tomadas (não revisitar sem motivo forte)

- Tailwind v4 com `@import` em vez de `@tailwind` (sintaxe nova)
- CSS customizado em arquivos separados por página, não em `globals.css`
- Open-Meteo escolhido por ser gratuito e não exigir API key
- Nominatim para reverse geocoding (gratuito, mas tem rate limit — não chamar em loop)
- Storage público para evitar lógica de signed URLs no front
- Google OAuth configurado em **Google Cloud Console** + **Supabase Auth** (ambos)
- RLS é a primeira linha de defesa — toda nova tabela precisa de policies antes de ir pro front
- Avatar usa crop circular via `react-easy-crop`, gerado em canvas 400x400px, salvo como JPEG
- Onboarding de perfil fica dentro de `closet/page.tsx` (não é rota separada)

## Estado atual das fases

- [x] Fase 0 — Setup
- [x] Fase 0.1 — Conexão Supabase
- [x] Fase 1 — Auth (email/senha + Google OAuth)
- [x] Fase 2 — Closet (CRUD de peças + foto no Storage)
- [x] Fase 3 — Lookbook (outfits salvos, filtro por período/ocasião)
- [x] Fase 4 — Outfit IA (geração com clima + ocasião, salvar no lookbook)
- [x] Fase 5 — Perfil (nome, altura, peso, estilo, avatar crop, logout, onboarding)
- [x] Fase 6 — Deploy (Vercel) — miaoutfitai.com.br em produção
- [x] Fase 7 — Monetização (Stripe live, checkout, webhook, portal)
- [x] Auditoria — schema versionado, Zod, moderação fail-closed, Vitest + CI, Sentry, hardening de funções do banco
- [x] Apagar conta (LGPD) — `DELETE /api/account` + botão em Perfil (cancela Stripe → apaga Storage → apaga Auth; o banco limpa por cascade)
- [x] Virtual Try-On **pausado** pré-lançamento: rotas `/api/tryon*` retornam 503 `FEATURE_DISABLED` via `TRYON_ENABLED=false` em `lib/feature-flags.ts`. Para retomar: migration 0001, regenerar tipos, criar a tela, limite em `plan-limits.ts`, ligar a flag
- [x] E-mails transacionais (Resend, via fetch em `lib/email.ts`): boas-vindas (`auth/callback`), trial acabando (cron diário `/api/cron/trial-reminder`, 3 dias antes) e falha de cobrança (webhook). Recibo = e-mails nativos do Stripe. Envio único em `profiles.welcome_email_sent_at` / `trial_reminder_sent_at` (migration 0006)
- [ ] Em aberto: backlog completo em `CONTEXT.md` seção 4

## Operação

- **Supabase Free pausa o projeto após ~1 semana sem atividade** (já aconteceu: ficou INACTIVE por ~4 meses). Se o site abrir mas login/dados falharem, checar o status no dashboard
- Sem `.env.local` o `npm run build` falha localmente (o CI injeta as variáveis do Supabase)
- Avisos restantes do advisor de segurança: `increment_usage` executável por `authenticated` (intencional) e proteção contra senhas vazadas (exige plano pago)

## Dívidas técnicas conhecidas

- `middleware.ts` está deprecado no Next.js 16 — deve ser renomeado para `proxy.ts` (não urgente)

## Como trabalhar comigo

- Antes de mudanças grandes, **explique o plano** primeiro (use plan mode)
- Mudou schema do banco? Regenerar `types/database.ts` na sequência
- Mudou rota? Conferir se o `middleware.ts` precisa ser atualizado
- Mexeu em RLS? Testar como usuário não autenticado E autenticado de outro `user_id`
- Não criar arquivos que não foram pedidos (sem README, sem docs extras)
- Não adicionar dependências sem perguntar — peso do bundle importa
