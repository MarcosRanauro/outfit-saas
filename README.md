# Outfit AI

Aplicativo SaaS de moda com inteligência artificial. Usuários cadastram 
suas peças, e a Mia — nossa stylist IA — gera outfits personalizados 
baseados no clima, ocasião e estilo de cada pessoa.

## Sobre o projeto

O Outfit AI nasceu de um lookbook pessoal e evoluiu para um produto 
completo com múltiplos usuários, autenticação, storage de fotos na 
nuvem e integração com IA de visão computacional.

## Funcionalidades

- **Closet** — Cadastro de peças com foto, categorias e filtros
- **Outfit IA** — Geração de 5 outfits por vez com base no clima real 
  (atual ou futuro), período do dia e ocasião
- **Lookbook** — Outfits salvos, filtráveis por período e ocasião
- **Wishlist** — Sugestões de peças para comprar baseadas no closet atual
- **Perfil** — Dados pessoais, avatar com crop circular e histórico de uso
- **Mia** — Stylist IA com visão computacional que analisa as fotos 
  reais das peças para combinações mais precisas

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16.2.6 (App Router) + TypeScript |
| Estilo | Tailwind CSS v4 + CSS customizado |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/senha + Google OAuth) |
| Storage | Supabase Storage |
| IA | Anthropic API (claude-sonnet-4-6) |
| Clima | Open-Meteo (gratuito, sem API key) |
| Deploy | Vercel — miaoutfitai.com.br |

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto. Use `.env.example` como referência completa — **nunca commite valores reais**.

```env
# ─── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=           # URL pública do projeto Supabase (ex: https://xxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Chave anônima pública do Supabase
SUPABASE_SERVICE_ROLE_KEY=          # Chave privada do Supabase — nunca expor no frontend

# ─── Anthropic (Mia) ───────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=                  # Chave da API do Claude para análise de peças, chat e descrição de fotos

# ─── Remove.bg (Foto de estúdio — ativo) ───────────────────────────────────────
REMOVE_BG_API_KEY=                  # Chave da API Remove.bg para remoção de fundo com fundo branco

# ─── OpenAI (Moderação de conteúdo — ativo + Foto de estúdio — disponível para reverter) ──
OPENAI_API_KEY=                     # Chave da API OpenAI — moderação de imagens (omni-moderation-latest, ativo) e foto de estúdio gpt-image-1 (comentado)

# ─── Fal.ai (Foto de estúdio — comentado, disponível para reverter) ────────────
# FAL_API_KEY=                      # Chave da API Fal.ai para BRIA RMBG

# ─── Photoroom (Ghost Mannequin — foto de estúdio) ─────────────────────────────
PHOTOROOM_API_KEY=                  # Chave da API Photoroom (Ghost Mannequin — image-api.photoroom.com)

# ─── FASHN.ai (Virtual Try-On + Foto de estúdio product-to-model) ───────────────
FASHN_API_KEY=                      # Chave da API FASHN.ai (tryon-v1.6 + product-to-model)

# ─── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=                  # Chave secreta do Stripe (sk_live_... ou sk_test_...)
STRIPE_WEBHOOK_SECRET=              # Segredo de validação do webhook Stripe (whsec_...)
STRIPE_PRICE_ID=                    # Price ID do plano Pro no Stripe (price_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Chave pública do Stripe (pk_live_... ou pk_test_...) — usada no checkout client-side

# ─── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=                # URL pública da aplicação (ex: https://www.miaoutfitai.com.br)
```

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/          # Login e cadastro
│   ├── (dashboard)/     # Área logada (closet, lookbook, outfit-ia, perfil)
│   └── api/             # Rotas de backend (clima, geração de outfits, wishlist)
├── components/          # Componentes reutilizáveis
├── lib/supabase/        # Configuração do Supabase
└── types/               # Tipos TypeScript
```

## Planos

| Plano | Preço | Limite |
|---|---|---|
| Free | R$ 0 | Limitado |
| Pro | R$ 19,00/mês | Ilimitado |

> Trial de 15 dias com acesso ilimitado. Após expirar, usuário `free` é bloqueado nas rotas de IA até assinar o Pro.

---

Desenvolvido com Next.js, Supabase e Anthropic API.
