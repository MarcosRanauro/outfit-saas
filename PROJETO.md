# Mia Outfit AI — Documentação do Projeto

> **Documento histórico.** Este arquivo registra decisões e marcos até v1.2.0. Para o estado **atual** do produto (v1.7.5, em produção), use [`CONTEXT.md`](./CONTEXT.md) como fonte viva.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16.2.6 (App Router) + TypeScript |
| Estilo | Tailwind CSS v4 + CSS customizado por página |
| Banco | Supabase (PostgreSQL) — região São Paulo (`sa-east-1`) |
| Auth | Supabase Auth (email/senha + Google OAuth) |
| Storage | Supabase Storage (buckets: `pieces`, `avatars`) — público |
| IA principal | Anthropic API (`claude-sonnet-4-6`) |
| Foto de estúdio | Remove.bg (`bg_color: ffffff`, `size: auto`, `format: png`) |
| Virtual Try-On | FASHN.ai (seleção múltipla e sequencial) |
| Moderação | OpenAI Moderation API (`omni-moderation-latest`) |
| Clima | Open-Meteo (gratuito, sem API key) + Nominatim (nome da cidade) |
| Pagamentos | Stripe (checkout + webhook HMAC + customer portal) |
| Analytics | Google Analytics (G-BE79RBHKKT) |
| Deploy | Vercel — domínio `miaoutfitai.com.br` |

---

## Identidade Visual

- **Tema:** Dark premium (preto com dourado/cobre) no app; paleta claro/escuro no dashboard (`--dash-*` CSS vars)
- **Cores principais:** `#080808` (fundo), `#111111` (card), `rgba(180,140,60)` (dourado)
- **Fontes:** Inter (corpo) + Bebas Neue (títulos)
- **Mobile first** em todos os componentes

---

## Estrutura do Banco

- `profiles` → dados do usuário (nome, altura, peso, estilo, plano, avatar, `trial_ends_at`, colunas `usage_*`, `usage_reset_at`)
- `pieces` → peças do closet com foto, categoria, cor primária, cor secundária, descrição, notas
- `outfits` → combinações salvas com tags de estilo, ocasião, período e "por que funciona"
- `outfit_history` → histórico de outfits usados
- Trigger: `on_auth_user_created` → cria perfil automaticamente no cadastro

### Colunas de rate limiting em `profiles`

| Coluna | Descrição |
|---|---|
| `usage_mia_generations` | Contador de mensagens no chat Mia |
| `usage_outfit_generations` | Contador de gerações de outfit |
| `usage_pieces_analyzed` | Contador de análises de peça |
| `usage_wishlist_generations` | Contador de gerações de wishlist |
| `usage_studio_generations` | Contador de fotos de estúdio |
| `usage_reset_at` | Data do último reset (reset a cada 30 dias, lazy) |

---

## Storage

- `pieces` → fotos das roupas (organizado por `user_id`) — público
- `avatars` → foto de perfil do usuário — público

> Storage público: URLs diretas sem signed URLs. Trade-off aceito — fotos de moda não são dados sensíveis. RLS protege o banco, não o storage.

---

## Planos

| Plano | Preço | Acesso |
|---|---|---|
| Free | R$ 0 | Limites por ação/mês |
| Pro | R$ 24,90/mês | Ilimitado |

> Só existem os planos `free` e `pro` — o plano Stylist foi descontinuado. Trial de 15 dias com acesso ilimitado. Após expirar, usuário `free` é bloqueado nas rotas de IA; usuário Pro nunca é bloqueado.

---

## Variáveis de Ambiente

Lista completa e comentada em [`.env.example`](./.env.example). Resumo:

| Variável | Descrição | Escopo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto Supabase | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública do Supabase | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada do Supabase — nunca expor no frontend | Apenas webhook Stripe |
| `ANTHROPIC_API_KEY` | Chave da API do Claude (análise, chat, descrição) | Server-side only |
| `REMOVE_BG_API_KEY` | Chave Remove.bg (remoção de fundo) | Server-side only |
| `OPENAI_API_KEY` | Moderação de imagens (`omni-moderation-latest`) | Server-side only |
| `PHOTOROOM_API_KEY` | Photoroom Ghost Mannequin | Server-side only |
| `FASHN_API_KEY` | FASHN.ai (try-on + product-to-model) | Server-side only |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe | Server-side only |
| `STRIPE_WEBHOOK_SECRET` | Segredo de validação do webhook Stripe | Server-side only |
| `STRIPE_PRICE_ID` | Price ID do plano Pro no Stripe | Server-side only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave pública do Stripe (checkout client-side) | Client |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação | Client + Server |

---

## Estado do Produto

### v1.0.0 — 2026-05-01 ✅

- Auth completo: email/senha + Google OAuth, recuperação de senha, confirmação de e-mail
- Closet: CRUD de peças com foto, compressão automática, upload para Supabase Storage
- Análise automática de peças com visão computacional (`/api/pieces/analyze`)
- Lookbook: outfits salvos com filtros por período e ocasião, modal de detalhe, exclusão
- Chat Mia com personalidade carioca, quick actions, cards de outfit inline, typing indicator, peça âncora, suporte a data futura
- Wishlist com sugestões de IA: prioridade alta/média/baixa, salvar, marcar como comprado, pré-preencher Nova Peça
- Geração de outfits com clima via Open-Meteo + Anthropic, bloqueio de peças já usadas entre gerações
- Perfil: avatar crop circular (400×400 JPEG), edição de nome/altura/peso/estilo, banner de plano
- Stripe: checkout, webhook com validação HMAC, portal de gerenciamento de assinatura
- Rate limiting por plano em todas as rotas de IA
- PWA: service worker network-first, página offline, manifest, botão de instalação Android e instrução iOS
- Google Analytics
- Páginas legais: Termos de Uso, Política de Privacidade
- Tour guiado do closet (exibido uma vez após onboarding)
- Onboarding modal de perfil dentro do closet
- **Deploy em produção: miaoutfitai.com.br**

### v1.1.0 — 2026-05-22 ✅

- Trial de 15 dias — coluna `trial_ends_at` no banco, lógica no rate limit, banner no perfil
- Virtual Try-On com FASHN.ai — seleção múltipla e sequencial, polling com limite de 30 tentativas, badge numérico de ordem
- Foto de estúdio (inicialmente com `gpt-image-1`, substituído em 1.2.0)
- Redesign completo do Dashboard: nova paleta claro/escuro, Bottom Nav dinâmico, `DashboardTopBanner`
- Redesign do Closet: grid 1–5 colunas, drawer de filtros, chips de grupo, peça âncora
- Persistência de colunas do grid via `localStorage`
- Página Nova Peça (`/closet/nova-peca`) com upload, análise Mia automática, galeria, compressão
- Redesign das páginas de Auth com toggle claro/escuro e fundo DALL-E
- Redesign da Landing page com ilustrações aquarela, ticker animado, IntersectionObserver
- Página `/sobre` com história e missão do produto
- FAQ com accordion — 4 categorias, 12 perguntas

### v1.2.0 — 2026-05-23 ✅

> Versões posteriores (redesigns, CI, moderação fail-closed, Zod, etc.) estão documentadas em [`CONTEXT.md`](./CONTEXT.md) — seção 12 (Histórico de implementações). Estado atual: **v1.7.5**, em produção em miaoutfitai.com.br.

- **Foto de estúdio com Remove.bg** — remoção de fundo com fidelidade 100% ao produto original
- Análise multi-foto via Mia: rota `/api/pieces/describe` envia até 3 fotos, retorna descrição técnica visual em inglês
- Galeria de até 6 fotos por peça com seleção de capa
- Campos `color_secondary`, `description` e `notes` nas peças
- Análise automática ao selecionar foto — sem botão manual
- Rate limiting para rota de estúdio (10/mês free, 999/mês pro)
- SSRF protection na rota de estúdio — validação de hostname contra Supabase antes de fetch
- **Moderação de conteúdo com OpenAI Moderation API** — toda foto passa por moderação antes de upload
- `.env.example`, `DECISOES.md`, `CHANGELOG.md`, `SECURITY.md` adicionados ao repositório

---

## Fases do projeto

| Fase | Status | Descrição |
|---|---|---|
| 0 — Setup | ✅ | Projeto Next.js + TypeScript |
| 0.1 — Supabase | ✅ | Conexão banco, auth, storage |
| 1 — Auth | ✅ | Email/senha + Google OAuth |
| 2 — Closet | ✅ | CRUD de peças + foto no Storage |
| 3 — Lookbook | ✅ | Outfits salvos, filtros |
| 4 — Outfit IA | ✅ | Geração com clima + ocasião |
| 5 — Perfil | ✅ | Avatar crop, onboarding, logout |
| 6 — Deploy | ✅ | Vercel — miaoutfitai.com.br |
| 7 — Monetização | ✅ | Stripe live, checkout, webhook, portal |

---

## Planejado (Unreleased)

- [ ] Redesign do Lookbook
- [ ] Redesign do Chat Mia
- [ ] Email transacional personalizado (Resend)
- [ ] Histórico de outfits usados com UI (`outfit_history`)
- [ ] Notificações push
- [ ] Publicação na Play Store via TWA/Capacitor

---

## Arquivos principais

### Infraestrutura
- `src/lib/supabase/client.ts` → conexão client-side
- `src/lib/supabase/server.ts` → conexão server-side
- `src/middleware.ts` → proteção de rotas autenticadas
- `src/types/database.ts` → tipos TypeScript do banco
- `src/lib/rate-limit.ts` → `checkRateLimit` e `incrementUsage` centralizados

### Layout e estilos
- `src/app/layout.tsx` → fontes e estrutura base
- `src/app/globals.css` → reset e estilos base
- `src/app/auth.css` → estilos dark premium (login/cadastro)
- `src/app/dashboard.css` → layout dashboard e bottom nav
- `src/app/closet.css` → estilos do closet
- `src/app/outfit-ia.css` → estilos do outfit IA
- `src/app/lookbook.css` → estilos do lookbook
- `src/app/mia.css` → estilos do chat Mia
- `src/app/perfil.css` → estilos do perfil
- `src/components/layout/BottomNav.tsx` → navegação inferior
- `src/components/layout/DashboardTopBanner.tsx` → banner superior do dashboard

### Autenticação
- `src/app/(auth)/login/page.tsx` → página de login
- `src/app/(auth)/cadastro/page.tsx` → página de cadastro
- `src/app/auth/callback/route.ts` → callback Google OAuth

### Dashboard
- `src/app/page.tsx` → redirect automático
- `src/app/(dashboard)/layout.tsx` → layout dashboard com bottom nav
- `src/app/(dashboard)/closet/page.tsx` → closet completo
- `src/app/(dashboard)/closet/nova-peca/page.tsx` → adicionar nova peça
- `src/app/(dashboard)/lookbook/page.tsx` → lookbook com filtros
- `src/app/(dashboard)/outfit-ia/page.tsx` → outfit IA com clima
- `src/app/(dashboard)/mia/page.tsx` → chat com a Mia
- `src/app/(dashboard)/wishlist/page.tsx` → wishlist com sugestões de IA
- `src/app/(dashboard)/perfil/page.tsx` → perfil do usuário

### API Routes
- `src/app/api/weather/route.ts` → clima via Open-Meteo
- `src/app/api/outfit/generate/route.ts` → geração de outfits
- `src/app/api/pieces/analyze/route.ts` → análise de peça com visão computacional
- `src/app/api/pieces/describe/route.ts` → análise multi-foto
- `src/app/api/pieces/studio/route.ts` → foto de estúdio (Remove.bg)
- `src/app/api/pieces/moderate/route.ts` → moderação de conteúdo (OpenAI)
- `src/app/api/pieces/tryon/route.ts` → virtual try-on (FASHN.ai)
- `src/app/api/mia/chat/route.ts` → chat com a Mia
- `src/app/api/wishlist/generate/route.ts` → geração de wishlist
- `src/app/api/stripe/checkout/route.ts` → criação de sessão de checkout
- `src/app/api/stripe/webhook/route.ts` → webhook Stripe com validação HMAC
- `src/app/api/stripe/portal/route.ts` → portal de gerenciamento de assinatura

### Páginas públicas
- `src/app/(public)/page.tsx` → landing page
- `src/app/(public)/sobre/page.tsx` → sobre o produto
- `src/app/(public)/faq/page.tsx` → FAQ com accordion
- `src/app/(public)/termos/page.tsx` → Termos de Uso
- `src/app/(public)/privacidade/page.tsx` → Política de Privacidade

---

## Decisões Técnicas

- **App Router do Next.js** (nunca Pages Router)
- **Tailwind v4** com `@import` — CSS customizado em arquivos separados por página
- **Google OAuth** configurado no Google Cloud Console + Supabase
- **Row Level Security** ativado em todas as tabelas — obrigatório em toda nova tabela
- **Storage público** para URLs de imagem direta — sem signed URLs
- **`font-size: 16px`** nos inputs para evitar zoom automático no iOS
- **Clima via Open-Meteo** (gratuito, sem API key) + Nominatim para nome da cidade
- **IA gera 5 outfits por vez** — usuário salva os que gostar
- **Modelo Anthropic fixo** como `"claude-sonnet-4-6"` em todas as rotas — atualizar requer revisar todos os `model:` no código
- **`ANTHROPIC_API_KEY`** é a chave de maior valor do projeto — nunca expor no client bundle
- **`SUPABASE_SERVICE_ROLE_KEY`** usada apenas no webhook do Stripe
- **Rate limiting lazy**: reset ocorre na primeira chamada após 30 dias (sem cron job)
- **Moderação fail-closed com retry**: toda foto passa por OpenAI Moderation API (`omni-moderation-latest`) antes do upload; até 3 tentativas com 500ms de intervalo; se a API não responder, o upload é **bloqueado** (HTTP 503, `reason: moderation_unavailable`) — ver `moderation-server.ts` e `CONTEXT.md`
- **`maxDuration = 60`** declarado nas rotas de IA (studio, tryon) para evitar timeout na Vercel
- Blocos anteriores de foto de estúdio (`gpt-image-1`, Photoroom, Fal.ai) mantidos comentados no código para reversão rápida