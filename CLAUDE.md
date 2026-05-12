# Outfit SaaS — Project Memory

App de outfits multi-usuário. Cada pessoa cadastra suas peças, monta combinações e recebe sugestões de IA baseadas no clima e na ocasião.

## Stack

- **Framework:** Next.js 16.2.4 (App Router) + TypeScript
- **Node.js:** v20.20.2 (obrigatório — Next.js 16 exige >=20.9.0)
- **Estilo:** Tailwind v4 (via `@import`) + CSS customizado em arquivos por página
- **Banco:** Supabase (PostgreSQL, região São Paulo)
- **Auth:** Supabase Auth (email/senha + Google OAuth)
- **Storage:** Supabase Storage — buckets `pieces` e `avatars`
- **IA:** Anthropic API, modelo `claude-sonnet-4-6`
- **Clima:** Open-Meteo (gratuito, sem API key)
- **Geolocalização:** browser API + Nominatim (nome da cidade)
- **Deploy:** Vercel (pendente)
- **Pagamentos:** Stripe (pendente)

## Mapa do código

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   └── callback/route.ts       # Google OAuth (duplicata de auth/callback)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # bottom nav + proteção de rota
│   │   ├── closet/page.tsx         # closet + modal onboarding de perfil
│   │   ├── lookbook/page.tsx
│   │   ├── outfit-ia/page.tsx      # geração de outfits com IA
│   │   └── perfil/page.tsx         # perfil completo com avatar crop
│   ├── api/
│   │   ├── weather/route.ts        # Open-Meteo
│   │   └── outfit/generate/route.ts # Anthropic API
│   ├── auth/callback/route.ts      # Google OAuth (rota principal)
│   ├── layout.tsx
│   ├── page.tsx                    # redirect automático (logado → /closet, não → /login)
│   ├── globals.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── closet.css                  # também importado em perfil/page.tsx (style-chips do onboarding)
│   ├── lookbook.css
│   ├── outfit-ia.css
│   └── perfil.css
├── components/
│   ├── layout/BottomNav.tsx        # navegação inferior (Closet, Lookbook, Outfit IA, Perfil)
│   └── ui/AvatarCrop.tsx           # crop circular de foto de perfil (react-easy-crop)
├── lib/supabase/
│   ├── client.ts                   # client-side
│   └── server.ts                   # server-side
├── types/database.ts               # tipos: Profile, Piece, Outfit, OutfitHistory
└── middleware.ts                   # proteção de rotas (⚠ deprecado no Next.js 16 — renomear para proxy)
```

## Banco de dados

- `profiles` — id, name, height, weight, style, avatar_url, plan (`free` | `pro` | `stylist`), closet_tour_completed, stripe_customer_id, stripe_subscription_id, plan_expires_at, usage_mia_generations, usage_outfit_generations, usage_pieces_analyzed, usage_wishlist_generations, usage_reset_at, created_at, updated_at
- `pieces` — id, user_id, code, name, category, color, brand, photo_url, fit, style_type, season, created_at
- `outfits` — id, user_id, name, subtitle, style_tags[], occasion_tags[], period, occasion, why, pieces (IDs[]), notes, created_at
- `outfit_history` — id, user_id, outfit_id, worn_at, occasion, created_at
- `wishlist_items` — id, user_id, name, category, color, reason, priority (`high` | `medium` | `low`), purchased, created_at
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
| Free | R$ 0 | limitado (peças e sugestões/mês) |
| Pro | R$ 19/mês | ilimitado |
| Stylist | R$ 79/mês | multi-closet (para personal stylists) |

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

## Dívidas técnicas conhecidas

- `middleware.ts` está deprecado no Next.js 16 — deve ser renomeado para `proxy.ts` (não urgente)

## Como trabalhar comigo

- Antes de mudanças grandes, **explique o plano** primeiro (use plan mode)
- Mudou schema do banco? Regenerar `types/database.ts` na sequência
- Mudou rota? Conferir se o `middleware.ts` precisa ser atualizado
- Mexeu em RLS? Testar como usuário não autenticado E autenticado de outro `user_id`
- Não criar arquivos que não foram pedidos (sem README, sem docs extras)
- Não adicionar dependências sem perguntar — peso do bundle importa
