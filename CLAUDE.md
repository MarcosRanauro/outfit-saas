# Outfit SaaS — Project Memory

App de outfits multi-usuário. Cada pessoa cadastra suas peças, monta combinações e recebe sugestões de IA baseadas no clima e na ocasião.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
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
│   │   └── cadastro/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # bottom nav
│   │   ├── closet/page.tsx
│   │   ├── lookbook/page.tsx
│   │   └── outfit-ia/page.tsx
│   ├── api/
│   │   ├── weather/route.ts        # Open-Meteo
│   │   └── outfit/generate/route.ts # Anthropic API
│   ├── auth/callback/route.ts      # Google OAuth
│   ├── layout.tsx
│   ├── page.tsx                    # redirect automático
│   ├── globals.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── closet.css
│   ├── lookbook.css
│   └── outfit-ia.css
├── components/
│   └── layout/BottomNav.tsx
├── lib/supabase/
│   ├── client.ts                   # client-side
│   └── server.ts                   # server-side
├── types/database.ts               # tipos do banco
└── middleware.ts                   # proteção de rotas
```

## Banco de dados

- `profiles` — nome, altura, peso, plano (`free` | `pro` | `stylist`)
- `pieces` — peças do closet, com `photo_url` no Storage
- `outfits` — combinações salvas com tags de estilo, ocasião, período e "por que funciona"
- `outfit_history` — histórico de outfits usados
- Trigger `on_auth_user_created` cria perfil automaticamente no signup
- **RLS ativado em todas as tabelas** — toda query precisa respeitar `auth.uid()`

## Identidade visual (não negociável)

- **Tema:** dark premium, preto com acento dourado/cobre
- **Cores:**
  - Fundo: `#080808`
  - Card: `#111111`
  - Acento: `rgba(180, 140, 60, 1)` (dourado)
- **Fontes:** Inter (corpo), Bebas Neue (títulos)
- **Mobile first** em todos os componentes — desktop é adaptação
- Tailwind v4 fica para utilitários; estilos visuais ficam em `.css` por página
- **Inputs sempre `font-size: 16px`** — qualquer valor menor causa zoom automático no iOS

## Regras de produto

- IA gera **5 outfits por vez**; o usuário salva os que gostar (não salva tudo)
- Outfits salvos vão pro Lookbook, filtráveis por período e ocasião
- Storage de fotos é **público** (URLs diretas, sem signed URLs)
- Fotos de peças ficam organizadas por `user_id` no bucket
- Modelo Anthropic é fixo em `claude-sonnet-4-6` — não trocar sem decisão

## Planos

| Plano | Preço | Limite |
|---|---|---|
| Free | R$ 0 | limitado (peças e sugestões/mês) |
| Pro | R$ 29/mês | ilimitado |
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
npm run dev              # dev server
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

## Estado atual das fases

- [x] Fase 0 — Setup
- [x] Fase 0.1 — Conexão Supabase
- [x] Fase 1 — Auth
- [x] Fase 2 — Closet
- [x] Fase 3 — Lookbook
- [x] Fase 4 — Outfit IA
- [ ] Fase 5 — Perfil (nome, altura, peso, estilo, avatar, logout) ← **próxima**
- [ ] Fase 6 — Deploy (Vercel)
- [ ] Fase 7 — Monetização (Stripe)

## Como trabalhar comigo

- Antes de mudanças grandes, **explique o plano** primeiro (use plan mode)
- Mudou schema do banco? Regenerar `types/database.ts` na sequência
- Mudou rota? Conferir se o `middleware.ts` precisa ser atualizado
- Mexeu em RLS? Testar como usuário não autenticado E autenticado de outro `user_id`
- Não criar arquivos que não foram pedidos (sem README, sem docs extras)
- Não adicionar dependências sem perguntar — peso do bundle importa
