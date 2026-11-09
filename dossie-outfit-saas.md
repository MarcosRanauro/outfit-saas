# Dossiê Técnico — Mia Outfit AI (`outfit-saas`)

> Gerado em 2026-11-06 por varredura automática de todos os arquivos do projeto.

---

## 1. Visão Geral

**Produto:** Mia Outfit AI — Assistente de moda com IA que cadastra roupas do usuário e gera looks personalizados com base no clima, ocasião e estilo pessoal.

**Domínio:** [miaoutfitai.com.br](https://miaoutfitai.com.br) | **Versão:** 1.7.7 | **Status:** Produção ativa (5 perfis, 71 peças)

**Propósito:** SaaS B2C de moda — stylist pessoal via IA, com closet digital, geração de outfits, chat com assistente "Mia", wishlist inteligente, foto de estúdio e sistema de assinaturas (Freemium + Pro).

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 |
| Linguagem | TypeScript | ^5 |
| UI Runtime | React | 19.2.4 |
| Estilo | Tailwind CSS v4 + CSS customizado por página | ^4.2.4 |
| Banco de dados | Supabase (PostgreSQL) — região `sa-east-1` | `@supabase/supabase-js` ^2.104.1 |
| Auth | Supabase Auth (email/senha + Google OAuth) | — |
| ORM / Client | `@supabase/ssr` (queries diretas, sem ORM) | ^0.10.2 |
| Storage | Supabase Storage (buckets `pieces`, `avatars`) | — |
| IA Principal | Anthropic Claude (`claude-sonnet-4-6`) | `@anthropic-ai/sdk` ^0.91.0 |
| IA Secundária | OpenAI (`omni-moderation-latest`) | `openai` ^6.39.0 |
| Foto de Estúdio | Remove.bg API | (via fetch, sem SDK) |
| Virtual Try-On | FASHN.ai (`tryon-v1.6`) + product-to-model | `@fal-ai/client` ^1.10.1 |
| Ghost Mannequin | Photoroom API | (via fetch) |
| Validação | Zod | ^3.25.76 |
| Pagamentos | Stripe (checkout + webhook HMAC + portal) | `stripe` ^22.1.1 |
| E-mails | Resend (via fetch, sem SDK) | — |
| Clima | Open-Meteo (gratuito, sem key) + Nominatim | — |
| Analytics | Google Analytics (G-BE79RBHKKT) | `@next/third-parties` ^16.2.6 |
| Monitoramento | Sentry | `@sentry/nextjs` ^10.57.0 |
| Testes | Vitest | ^3.2.6 |
| Deploy | Vercel | — |
| Imagens | sharp | ^0.34.5 |
| Crop de avatar | react-easy-crop | ^5.5.7 |

---

## 3. Estrutura de Diretórios

```
outfit-saas/
├── AGENTS.md                  # Regras para agentes de IA
├── AUDIT.md                   # Auditoria técnica
├── CHANGELOG.md               # Histórico de versões
├── CLAUDE.md                  # Contexto para Claude
├── CONTEXT.md                 # Memória viva do projeto (fonte de verdade)
├── DECISOES.md                # ADRs (Architecture Decision Records)
├── PROJETO.md                 # Documentação histórica (até v1.2.0)
├── SECURITY.md                # Políticas de segurança
├── next.config.ts             # Config Next.js + Sentry + CSP headers
├── vercel.json                # Cron jobs (trial-reminder: 12h diário)
├── vitest.config.ts           # Configuração de testes
├── tsconfig.json
├── package.json
├── .env.example               # Todas as variáveis documentadas
│
├── public/
│   ├── favicon/               # Favicons em todos os tamanhos
│   ├── logos-mia-ai/          # Logos e branding do produto
│   ├── illustrations/         # Ilustrações (hero, features, fondos)
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker (PWA)
│
├── scripts/
│   ├── audit-project.sh
│   ├── audit-storage-moderation.mjs
│   └── generate-favicon.js
│
├── supabase/
│   ├── schema.sql             # Dump completo do schema de produção
│   └── migrations/
│       ├── 0001_tryon_predictions.sql
│       ├── 0002_piece_photos.sql
│       ├── 0003_secure_increment_usage.sql
│       ├── 0004_usage_model_generations.sql
│       ├── 0005_harden_function_grants.sql
│       ├── 0006_email_flags.sql
│       └── 0007_storage_hardening.sql
│
├── reports/
│   ├── project-audit-2026-05-23_15-35-34.md
│   └── session-2026-05-24.md
│
└── src/
    ├── middleware.ts           # Proteção de rotas (Supabase Auth)
    ├── instrumentation.ts     # Sentry server
    ├── instrumentation-client.ts  # Sentry client
    ├── sentry.server.config.ts
    ├── sentry.edge.config.ts
    ├── sentry.shared.ts
    │
    ├── app/
    │   ├── layout.tsx          # Root layout (Inter + Bebas Neue, GA, PWA, SEO)
    │   ├── page.tsx            # Redirect automático (root)
    │   ├── global-error.tsx    # Sentry error boundary global
    │   ├── globals.css
    │   ├── auth.css / closet.css / dashboard.css / lookbook.css
    │   ├── mia.css / outfit-ia.css / perfil.css / wishlist.css
    │   ├── landing.css / studio-scanner.css / faq.css
    │   │
    │   ├── (auth)/            # Route group — sem BottomNav
    │   │   ├── login/page.tsx
    │   │   ├── cadastro/page.tsx
    │   │   └── esqueci-senha/page.tsx
    │   │
    │   ├── auth/
    │   │   ├── callback/route.ts   # OAuth callback
    │   │   └── reset-password/page.tsx
    │   │
    │   ├── (dashboard)/       # Route group — com BottomNav + auth check
    │   │   ├── layout.tsx          # Auth guard + welcome email
    │   │   ├── closet/
    │   │   │   ├── page.tsx
    │   │   │   ├── nova-peca/page.tsx
    │   │   │   └── [id]/page.tsx   # Detalhe da peça
    │   │   ├── lookbook/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx   # Detalhe do outfit
    │   │   ├── mia/page.tsx
    │   │   ├── outfit-ia/page.tsx
    │   │   └── perfil/page.tsx
    │   │
    │   ├── api/
    │   │   ├── account/route.ts
    │   │   ├── cron/trial-reminder/route.ts
    │   │   ├── mia/
    │   │   │   ├── chat/route.ts
    │   │   │   └── extract-date/route.ts
    │   │   ├── outfit/generate/route.ts
    │   │   ├── pieces/
    │   │   │   ├── analyze/route.ts
    │   │   │   ├── describe/route.ts
    │   │   │   ├── ghost-mannequin/route.ts
    │   │   │   ├── moderate/route.ts
    │   │   │   └── studio/route.ts
    │   │   ├── storage/upload/route.ts
    │   │   ├── stripe/
    │   │   │   ├── checkout/route.ts
    │   │   │   ├── portal/route.ts
    │   │   │   └── webhook/route.ts
    │   │   ├── tryon/route.ts        ⚠️ PAUSADO (TRYON_ENABLED=false)
    │   │   ├── tryon/status/route.ts ⚠️ PAUSADO
    │   │   ├── weather/route.ts
    │   │   └── wishlist/generate/route.ts
    │   │
    │   ├── landing/page.tsx + layout.tsx
    │   ├── faq/page.tsx + layout.tsx
    │   ├── sobre/page.tsx + layout.tsx
    │   ├── privacidade/page.tsx + layout.tsx
    │   ├── termos/page.tsx + layout.tsx
    │   └── offline/page.tsx
    │
    ├── components/
    │   ├── closet/
    │   │   ├── ClosetFiltersDrawer.tsx
    │   │   ├── ClosetOnboarding.tsx
    │   │   ├── ClosetTour.tsx
    │   │   ├── WishlistSavedModal.tsx
    │   │   └── WishlistSuggestionsModal.tsx
    │   ├── layout/
    │   │   ├── BottomNav.tsx
    │   │   └── DashboardTopBanner.tsx
    │   ├── lookbook/
    │   │   └── LookbookFiltersDrawer.tsx
    │   ├── studio/
    │   │   └── StudioScannerOverlay.tsx
    │   └── ui/
    │       ├── AvatarCrop.tsx
    │       ├── ModeToggle.tsx
    │       ├── TrialExpiredModal.tsx
    │       └── TrialExpiredModal.css
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts       # Supabase client-side
    │   │   ├── server.ts       # Supabase server-side (cookies)
    │   │   └── admin.ts        # Supabase service role (webhook Stripe)
    │   ├── ai-schemas.ts       # Zod schemas para saída da IA
    │   ├── api-schemas.ts      # Zod schemas para bodies de request
    │   ├── delete-account.ts   # LGPD: deleção de conta
    │   ├── email.ts            # Resend client (fetch)
    │   ├── email-templates.ts  # Templates de e-mail
    │   ├── feature-flags.ts    # TRYON_ENABLED=false
    │   ├── image.ts            # sharp + moderação
    │   ├── image-upload.ts     # Upload de imagens
    │   ├── moderation-server.ts # OpenAI moderation fail-closed
    │   ├── parse-request-body.ts
    │   ├── piece-photos.ts
    │   ├── plan-limits.ts      # Limites por plano
    │   ├── pricing.ts          # Preço Pro: R$ 24,90/mês
    │   ├── rate-limit.ts       # checkRateLimit + incrementUsage
    │   ├── storage-url.ts      # Validação de URLs do Storage
    │   ├── trial-reminder.ts
    │   └── welcome-email.ts
    │
    └── types/
        ├── app.ts              # Tipos manuais (Profile, Piece, Outfit, etc.)
        └── database.ts         # Gerado automaticamente pelo Supabase CLI
```

---

## 4. Arquitetura

### Framework
- **Next.js 16.2.6** com **App Router** (nunca Pages Router)
- Server Components como padrão; Client Components apenas quando necessário
- Server Actions com `bodySizeLimit: '20mb'` (para upload de imagens)
- `maxDuration = 60` declarado nas rotas de IA pesadas (studio, tryon)

### Banco de Dados
- **Supabase PostgreSQL** — região São Paulo (`sa-east-1`)
- Sem ORM (Drizzle/Prisma) — queries diretas com `@supabase/ssr`
- **Row Level Security (RLS)** ativo em todas as tabelas

### Autenticação
- **Supabase Auth** — email/senha + Google OAuth
- Middleware em `src/middleware.ts` com `createServerClient`
- Trigger `on_auth_user_created` → cria perfil automaticamente
- Trial de 15 dias (`trial_ends_at`) para novos usuários

### Estilo / UI
- **Tailwind CSS v4** com `@import` via PostCSS
- CSS customizado por página (`auth.css`, `closet.css`, etc.)
- Sistema de temas `--ec-*` (Édition Claire/Dark Edition) via `html.mode-dark`
- Fontes: **Inter** (corpo) + **Bebas Neue** (títulos no dark); **Cormorant Garamond** (no light)
- Mobile-first em todos os componentes
- **Sem shadcn/ui** — componentes customizados do zero

### Pagamentos
- **Stripe** — checkout session, webhook HMAC (`STRIPE_WEBHOOK_SECRET`), customer portal
- Plano Pro: **R$ 24,90/mês** (`STRIPE_PRICE_ID`)
- Webhook em `/api/stripe/webhook` — único ponto que usa `SUPABASE_SERVICE_ROLE_KEY`

### Inteligência Artificial

| Rota/Uso | Modelo | Provedor |
|---|---|---|
| Chat Mia, Análise de peças, Outfits, Wishlist | `claude-sonnet-4-6` | Anthropic |
| Moderação de imagens | `omni-moderation-latest` | OpenAI |
| Foto de estúdio (fundo branco) | Remove.bg API | Remove.bg |
| Foto com modelo (product-to-model) | FASHN.ai | FASHN |
| Ghost Mannequin | Photoroom API | Photoroom |
| Virtual Try-On | `tryon-v1.6` (**PAUSADO**) | FASHN |

### PWA
- Service Worker `network-first` em `public/sw.js`
- Manifest completo com ícones 16px→512px
- Página offline em `/offline`

---

## 5. Modelos de Dados (Supabase/PostgreSQL)

### `profiles`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK — referência ao `auth.users` |
| `name` | text | Nome do usuário |
| `height` | integer | Altura (cm) |
| `weight` | integer | Peso (kg) |
| `style` | text | Estilo pessoal |
| `avatar_url` | text | URL da foto de perfil |
| `plan` | text | `'free'` ou `'pro'` (default: `'free'`) |
| `stripe_customer_id` | text | ID de cliente no Stripe |
| `stripe_subscription_id` | text | ID de assinatura no Stripe |
| `plan_expires_at` | timestamptz | Expiração do plano |
| `trial_ends_at` | timestamptz | Expiração do trial (15 dias do cadastro) |
| `closet_tour_completed` | boolean | Tour guiado exibido? |
| `usage_mia_generations` | integer | Contador de mensagens chat |
| `usage_outfit_generations` | integer | Contador de outfits gerados |
| `usage_pieces_analyzed` | integer | Contador de análises de peça |
| `usage_wishlist_generations` | integer | Contador de wishlist gerada |
| `usage_studio_generations` | integer | Contador de fotos estúdio |
| `usage_model_generations` | integer | Contador de fotos com modelo |
| `usage_reset_at` | timestamptz | Último reset dos contadores (lazy, a cada 30 dias) |
| `welcome_email_sent_at` | timestamptz | Idempotência do e-mail de boas-vindas |
| `trial_reminder_sent_at` | timestamptz | Idempotência do lembrete de trial |
| `created_at` / `updated_at` | timestamptz | — |

### `pieces`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `code` | text | Código interno |
| `name` | text | Nome da peça |
| `category` | text | Categoria (roupa, calçado, acessório) |
| `color` | text | Cor primária |
| `color_secondary` | text | Cor secundária |
| `brand` | text | Marca |
| `photo_url` | text | URL da foto de capa |
| `fit` | text | Fit (slim, regular, oversized…) |
| `style_type` | text | Estilo da peça |
| `season` | text | Estação |
| `description` | text | Descrição técnica (gerada pela Mia) |
| `notes` | text | Notas pessoais |
| `created_at` | timestamptz | — |

### `piece_photos`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `piece_id` | uuid | FK → pieces |
| `user_id` | uuid | FK → profiles |
| `url` | text | URL da foto |
| `is_cover` | boolean | É a foto de capa? |
| `is_studio` | boolean | É foto de estúdio? |
| `sort_order` | integer | Ordem de exibição |
| `created_at` | timestamptz | — |

### `outfits`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `name` | text | Nome do outfit |
| `subtitle` | text | Subtítulo (gerado pela IA) |
| `style_tags` | text[] | Tags de estilo |
| `occasion_tags` | text[] | Tags de ocasião |
| `occasion` | text | Ocasião principal |
| `period` | text | Período (dia/noite) |
| `pieces` | uuid[] | IDs das peças (array) |
| `why` | text | "Por que funciona" (gerado pela IA) |
| `notes` | text | Notas |
| `created_at` | timestamptz | — |

### `outfit_history`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `outfit_id` | uuid | FK → outfits |
| `worn_at` | date | Data que foi usado |
| `occasion` | text | Ocasião |
| `created_at` | timestamptz | — |

### `wishlist_items`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `category` | text | Categoria da peça desejada |
| `name` | text | Nome sugerido |
| `color` | text | Cor sugerida |
| `reason` | text | Por que a IA sugeriu |
| `priority` | text | `'high'`, `'medium'`, `'low'` |
| `purchased` | boolean | Já comprou? |
| `created_at` | timestamptz | — |

### Funções PostgreSQL
| Função | Descrição |
|---|---|
| `handle_new_user()` | Trigger: cria perfil no cadastro |
| `set_trial_on_signup()` | Trigger: define `trial_ends_at = NOW() + 15 days` |
| `increment_usage(user_id, column_name)` | RPC SECURITY DEFINER — usa `auth.uid()` internamente |

---

## 6. Rotas e Páginas

### Públicas (sem autenticação)
| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `src/app/page.tsx` | Redirect automático |
| `/landing` | `src/app/landing/page.tsx` | Landing page |
| `/sobre` | `src/app/sobre/page.tsx` | Sobre o produto |
| `/faq` | `src/app/faq/page.tsx` | FAQ com accordion |
| `/termos` | `src/app/termos/page.tsx` | Termos de Uso |
| `/privacidade` | `src/app/privacidade/page.tsx` | Política de Privacidade |
| `/offline` | `src/app/offline/page.tsx` | PWA offline fallback |

### Autenticação
| Rota | Arquivo | Descrição |
|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` | Login email/senha + Google |
| `/cadastro` | `src/app/(auth)/cadastro/page.tsx` | Cadastro |
| `/esqueci-senha` | `src/app/(auth)/esqueci-senha/page.tsx` | Recuperação de senha |
| `/auth/callback` | `src/app/auth/callback/route.ts` | OAuth callback (Google) |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | Redefinir senha |

### Dashboard (autenticadas)
| Rota | Arquivo | Descrição |
|---|---|---|
| `/closet` | `src/app/(dashboard)/closet/page.tsx` | Closet com grid e filtros |
| `/closet/nova-peca` | `.../nova-peca/page.tsx` | Adicionar nova peça |
| `/closet/[id]` | `.../closet/[id]/page.tsx` | Detalhe + edição da peça |
| `/lookbook` | `.../lookbook/page.tsx` | Lookbook de outfits |
| `/lookbook/[id]` | `.../lookbook/[id]/page.tsx` | Detalhe do outfit |
| `/outfit-ia` | `.../outfit-ia/page.tsx` | Geração de outfits com clima |
| `/mia` | `.../mia/page.tsx` | Chat com a Mia |
| `/perfil` | `.../perfil/page.tsx` | Perfil + plano + uso + apagar conta |

> **Nota:** A rota `/wishlist` não possui `page.tsx` próprio — a funcionalidade está embutida no closet como modal.

---

## 7. API Routes

### IA / Funcionalidades
| Rota | Método | Descrição |
|---|---|---|
| `/api/mia/chat` | POST | Chat com a Mia (Anthropic `claude-sonnet-4-6`, streaming) |
| `/api/mia/extract-date` | POST | Extrai data de evento do texto do usuário |
| `/api/outfit/generate` | POST | Gera 5 outfits com clima (Anthropic) |
| `/api/pieces/analyze` | POST | Análise visual de peça com foto (Anthropic) |
| `/api/pieces/describe` | POST | Análise multi-foto (até 3 fotos, Anthropic) |
| `/api/pieces/studio` | POST | Foto de estúdio — fundo branco (Remove.bg) |
| `/api/pieces/ghost-mannequin` | POST | Ghost Mannequin (Photoroom) |
| `/api/pieces/moderate` | POST | Moderação de conteúdo (OpenAI omni-moderation) |
| `/api/wishlist/generate` | POST | Gera sugestões de wishlist (Anthropic) |
| `/api/weather` | GET | Clima via Open-Meteo + Nominatim |
| `/api/storage/upload` | POST | Upload seguro de imagens (magic bytes + sharp + moderação) |

### Virtual Try-On (PAUSADO — `TRYON_ENABLED=false`)
| Rota | Método | Descrição |
|---|---|---|
| `/api/tryon` | POST | Inicia try-on (FASHN.ai tryon-v1.6) — retorna 503 |
| `/api/tryon/status` | GET | Polling do status — retorna 503 |

### Stripe
| Rota | Método | Descrição |
|---|---|---|
| `/api/stripe/checkout` | POST | Cria sessão de checkout |
| `/api/stripe/webhook` | POST | Webhook com validação HMAC |
| `/api/stripe/portal` | POST | Portal de gerenciamento de assinatura |

### Conta e Cron
| Rota | Método | Descrição |
|---|---|---|
| `/api/account` | DELETE | Apagar conta (LGPD) — cancela Stripe, remove Storage, deleta usuário |
| `/api/cron/trial-reminder` | GET | Cron diário (12h) — lembrete de trial expirando em 3 dias |

---

## 8. Componentes Principais

| Componente | Localização | Descrição |
|---|---|---|
| `BottomNav` | `components/layout/BottomNav.tsx` | Navegação inferior do dashboard |
| `DashboardTopBanner` | `components/layout/DashboardTopBanner.tsx` | Banner superior do dashboard |
| `ClosetFiltersDrawer` | `components/closet/ClosetFiltersDrawer.tsx` | Drawer de filtros do closet |
| `ClosetOnboarding` | `components/closet/ClosetOnboarding.tsx` | Modal de onboarding (nome, altura, peso, estilo) |
| `ClosetTour` | `components/closet/ClosetTour.tsx` | Tour guiado do closet (exibido uma vez) |
| `WishlistSavedModal` | `components/closet/WishlistSavedModal.tsx` | Modal de confirmação de item salvo |
| `WishlistSuggestionsModal` | `components/closet/WishlistSuggestionsModal.tsx` | Modal de sugestões de wishlist |
| `LookbookFiltersDrawer` | `components/lookbook/LookbookFiltersDrawer.tsx` | Drawer de filtros do lookbook |
| `StudioScannerOverlay` | `components/studio/StudioScannerOverlay.tsx` | Animação de scanner no loading de estúdio |
| `AvatarCrop` | `components/ui/AvatarCrop.tsx` | Crop circular de avatar (react-easy-crop) |
| `ModeToggle` | `components/ui/ModeToggle.tsx` | Toggle Édition Claire / Dark Edition |
| `TrialExpiredModal` | `components/ui/TrialExpiredModal.tsx` | Modal de trial expirado → upgrade |

---

## 9. Variáveis de Ambiente (`.env.example`)

| Variável | Escopo | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Chave anônima pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Chave privada — usada apenas no webhook Stripe |
| `ANTHROPIC_API_KEY` | Server only | Claude (chat, análise, outfits, wishlist, describe) |
| `REMOVE_BG_API_KEY` | Server only | Remove.bg — fundo branco das peças |
| `OPENAI_API_KEY` | Server only | Moderação de imagens (`omni-moderation-latest`) |
| `PHOTOROOM_API_KEY` | Server only | Ghost Mannequin (Photoroom) |
| `FASHN_API_KEY` | Server only | Try-on + product-to-model (FASHN.ai) |
| `STRIPE_SECRET_KEY` | Server only | Stripe (`sk_live_...` ou `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Server only | Validação HMAC do webhook (`whsec_...`) |
| `STRIPE_PRICE_ID` | Server only | Price ID do plano Pro (`price_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe checkout client-side (`pk_...`) |
| `RESEND_API_KEY` | Server only | E-mails transacionais (`re_...`) |
| `CRON_SECRET` | Server only | Bearer token dos cron jobs da Vercel |
| `NEXT_PUBLIC_APP_URL` | Client + Server | URL pública da aplicação |
| `NEXT_PUBLIC_SENTRY_DSN` | Client + Server | DSN do Sentry ⚠️ não configurado na Vercel |
| `SENTRY_ORG` | Build only | Org Sentry (source maps) |
| `SENTRY_PROJECT` | Build only | Project Sentry (source maps) |
| `SENTRY_AUTH_TOKEN` | Build only | Token Sentry (source maps — nunca commitar) |
| `FAL_API_KEY` | Server only | Fal.ai BRIA RMBG (comentado — disponível para reverter) |

---

## 10. Planos e Limites

| Funcionalidade | Free | Pro | Trial (15 dias) |
|---|---|---|---|
| Chat Mia | 10/mês | 999/mês | Ilimitado |
| Gerar outfits | 5/mês | 999/mês | Ilimitado |
| Analisar peças | 3/mês | 999/mês | Ilimitado |
| Wishlist IA | 3/mês | 999/mês | Ilimitado |
| Foto de estúdio | 0/mês | 50/mês | 50/mês |
| Foto com modelo | 0/mês | 10/mês | 10/mês |

> Reset de contadores: **lazy**, a cada 30 dias da última chamada (sem cron job).
> Usuários com trial expirado e plano `free` são **bloqueados** em todas as rotas de IA.

**Preço Pro:** R$ 24,90/mês

---

## 11. Scripts Disponíveis (`package.json`)

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `next dev` | Servidor de desenvolvimento |
| `build` | `next build` | Build de produção |
| `start` | `next start` | Servidor de produção |
| `lint` | `eslint` | Lint do projeto |
| `test` | `vitest run` | Testes unitários (single run) |
| `test:watch` | `vitest` | Testes em modo watch |
| `audit:project` | `bash scripts/audit-project.sh` | Auditoria automatizada |

---

## 12. Testes

- **Framework:** Vitest ^3.2.6
- **Total:** 26 testes passando (última verificação: v1.7.7)
- **CI:** `.github/workflows/ci.yml` — Node 20, `npm ci`, lint, test, build em PR e push para `main`
- **Arquivos de teste:**
  - `src/lib/ai-schemas.test.ts`
  - `src/lib/api-schemas.test.ts`
  - `src/lib/delete-account.test.ts`
  - `src/lib/email-templates.test.ts`
  - `src/lib/email.test.ts`
  - `src/lib/image-upload.test.ts`
  - `src/lib/plan-limits.test.ts`
  - `src/lib/rate-limit.test.ts`
  - `src/lib/storage-url.test.ts`
  - `src/lib/trial-reminder.test.ts`
  - `src/app/api/storage/upload/route.test.ts`

---

## 13. Segurança

| Mecanismo | Implementação |
|---|---|
| **RLS** | Ativo em todas as tabelas — cada usuário vê apenas seus dados |
| **Moderação de imagens** | OpenAI `omni-moderation-latest` — fail-closed com 3 retries e 500ms entre tentativas |
| **Upload seguro** | `POST /api/storage/upload` — magic bytes, re-encode JPEG com sharp, path controlado pelo servidor |
| **SSRF** | Validação de URLs contra domínio do Supabase antes de qualquer fetch |
| **Webhook Stripe** | Validação HMAC com `STRIPE_WEBHOOK_SECRET` |
| **Rate limiting** | Contadores em `profiles` + RPC `increment_usage` com `auth.uid()` |
| **CSP** | `Content-Security-Policy-Report-Only` (ainda não bloqueante) |
| **Security Headers** | X-Frame-Options DENY, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy |
| **Zod** | Validação de bodies de request e saída da IA em todas as rotas |
| **Chaves de API** | Nenhuma chave exposta no client bundle |

---

## 14. Estado Atual — Implementado vs Pendente

### ✅ Totalmente Implementado

- Auth completo (email/senha + Google OAuth + recuperação de senha + confirm email)
- Closet CRUD com múltiplas fotos, capa, análise IA automática
- Detalhe da peça com modo visualização/edição
- Foto de estúdio (Remove.bg — fundo branco)
- Foto com modelo IA (FASHN product-to-model)
- Ghost Mannequin (Photoroom)
- Lookbook com filtros, busca, detalhe do outfit
- Chat Mia com personalidade, quick actions, cards inline, suporte a peça âncora e data futura
- Geração de outfits (5 por vez, considera clima real)
- Wishlist com sugestões de IA e prioridades
- Perfil com avatar crop, stats, dados pessoais, card de plano, apagar conta (LGPD)
- Stripe — checkout, webhook HMAC, portal de assinatura
- Trial de 15 dias com modal de expiração (`TrialExpiredModal`)
- Rate limiting por plano (lazy reset a cada 30 dias)
- E-mails transacionais (boas-vindas, lembrete de trial, falha de cobrança) via Resend
- PWA completo (service worker, manifest, offline, instalação Android/iOS)
- Google Analytics + Sentry
- Sistema de temas Édition Claire / Dark Edition
- 26 testes unitários + CI no GitHub Actions
- Moderação de imagens fail-closed com retry
- Security headers + CSP Report-Only
- Deleção de conta (cancela Stripe + remove Storage + deleta Auth)
- Cron job de lembrete de trial (Vercel, 12h diário)

### ⚠️ Implementado mas PAUSADO

- **Virtual Try-On** (FASHN.ai `tryon-v1.6`) — `TRYON_ENABLED = false` em `lib/feature-flags.ts`
  - Código mantido nas rotas `/api/tryon` e `/api/tryon/status` (retornam 503)
  - Migration `0001_tryon_predictions.sql` existe mas **não foi aplicada em produção**
  - Sem UI — a tela de try-on não foi construída
  - Para retomar: aplicar migration, habilitar flag, criar UI, adicionar limite de plano

### 🔲 Planejado / Não Implementado

- **Histórico de outfits usados com UI** — tabela `outfit_history` existe no banco mas não há página dedicada
- **Redesign do Lookbook** — pendente
- **Redesign do Chat Mia** — pendente
- **Notificações push** — não iniciado
- **Publicação na Play Store** via TWA/Capacitor — não iniciado
- **CSP bloqueante** — atualmente em modo Report-Only; pendente revisar relatórios e promover

### ⚠️ Dívidas Técnicas

| Item | Severidade | Status |
|---|---|---|
| Migration `0000_initial_schema.sql` não commitada | Baixa | Pendente rodar `supabase db pull` localmente |
| Migrations aplicadas via SQL direto — `migration list` dessincronizado | Baixa | Cosmético |
| `middleware.ts` deprecado no Next 16 (aviso no build) | Baixa | A revisar |
| `NEXT_PUBLIC_SENTRY_DSN` não configurada na Vercel | Média | Pendente |
| CSP Report-Only → bloqueante após validar relatórios | Média | Pendente |
| 31 warnings ESLint de `set-state-in-effect` | Baixa | Funcional |
| Cobertura de testes limitada (webhook Stripe, parsing IA não cobertos) | Média | Pendente |
| Supabase Free pausa projeto inativo após ~4 meses | Alta (ops) | Monitorar |

---

## 15. Arquivos de Documentação Interna

| Arquivo | Propósito |
|---|---|
| `CONTEXT.md` | **Memória viva** — estado atual, histórico por versão, próximos passos |
| `PROJETO.md` | Documentação histórica até v1.2.0 |
| `DECISOES.md` | ADRs — por que cada decisão técnica foi tomada |
| `CHANGELOG.md` | Changelog por versão no formato Keep a Changelog |
| `AGENTS.md` | Regras para agentes de IA |
| `CLAUDE.md` | Contexto específico para Claude |
| `AUDIT.md` | Resultado de auditorias técnicas |
| `SECURITY.md` | Política de segurança e reporte de vulnerabilidades |
| `reports/` | Relatórios de sessões e auditorias |
