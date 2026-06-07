# CONTEXT.md

> Memória viva do projeto. Atualizar ao final de cada implementação relevante.
> Este arquivo é a principal fonte de contexto para a IA retomar o trabalho entre sessões.

---

## 1. Estado atual do projeto

**Status:** Em produção
**Versão:** 1.4.0
**Última atualização:** 2026-06-07
**Domínio:** miaoutfitai.com.br
**Próxima ação recomendada:** Redesign visual do Chat da Mia e Perfil seguindo o sistema Édition Claire / Dark Edition.

---

## 2. O que já está funcionando

### Infraestrutura
- [x] Next.js 15 App Router + TypeScript + Tailwind CSS v4
- [x] Supabase (PostgreSQL + Auth + Storage) — região São Paulo
- [x] Vercel — domínio miaoutfitai.com.br com redirect www → sem www (308)
- [x] PWA completo (service worker, manifest, instalação Android e iOS)
- [x] Google Analytics (G-BE79RBHKKT)

### Autenticação
- [x] Login email/senha + Google OAuth
- [x] Recuperação de senha e confirmação de e-mail
- [x] Trigger automático de criação de perfil no cadastro
- [x] Middleware de proteção de rotas autenticadas

### Sistema visual
- [x] Dois modos: Édition Claire (claro) e Dark Edition (escuro)
- [x] Toggle pill "Édition Claire / Dark Edition" com persistência em localStorage
- [x] Variáveis CSS `--ec-*` — troca de modo via classe `html.mode-dark`
- [x] Landing page redesenhada nos dois modos (desktop + mobile)
- [x] Login/cadastro com split screen 60/40 (ilustração aquarela + formulário)
- [x] Página /sobre no padrão Édition Claire
- [x] Fontes: Cormorant Garamond (Claire) + Inter 300 (Dark)

### Closet
- [x] CRUD de peças com upload, compressão e moderação automática
- [x] Galeria de até 6 fotos por peça com seleção de capa
- [x] Análise automática com visão computacional (Mia) — badge MIA nos campos
- [x] Campos: categoria, cor primária/secundária, descrição, notas, fit, estação, estilo
- [x] Grid 1–5 colunas com persistência via localStorage
- [x] Drawer de filtros (desktop) / bottom sheet (mobile)
- [x] Chips de grupo: Todos / Roupas / Calçados / Acessórios
- [x] Peça âncora
- [x] Foto de estúdio com fundo branco (Remove.bg)
- [x] Virtual Try-On com FASHN.ai
- [x] Moderação OpenAI antes de qualquer upload
- [x] object-position: top nos cards (não corta colarinho/ombros)
- [x] object-fit: contain no detalhe (peça inteira visível)
- [x] Sistema visual --ec-* aplicado (header, cards, drawer, chips, bottom nav)

### Lookbook
- [x] Banner/header antigo removido — usa header padrão do app
- [x] Cards com layout split: foto principal esquerda (42%) + info/thumbs direita
- [x] Thumbs das peças na base do card (52×52px) com borda ativa em `var(--ec-accent)`
- [x] Grid 2 colunas no desktop, 1 coluna no mobile
- [x] Busca por nome do outfit em tempo real
- [x] Chips de ocasião com scroll horizontal e fade nas bordas
- [x] Drawer de filtros: Período, Ocasião, Estilo, Estação
- [x] Toggle Dia/Noite dentro do drawer (removido standalone)
- [x] Página de detalhe do outfit — split 50/50, foto sticky no desktop
- [x] Thumbs no detalhe trocam a foto principal (não redirecionam para o closet)
- [x] object-fit: contain no detalhe (peça inteira visível)
- [x] Sistema visual --ec-* aplicado nos dois modos

### Outfit IA
- [x] Geração de 5 outfits com clima real (Open-Meteo + geolocalização)
- [x] Seleção de período e ocasião
- [x] Bloqueio de peças já usadas entre gerações
- [x] Salvar no Lookbook

### Chat Mia
- [x] Personalidade carioca definida
- [x] Quick actions, cards de outfit inline, typing indicator
- [x] Suporte a data futura e peça âncora
- [ ] Redesign visual pendente

### Wishlist
- [x] Sugestões de IA com prioridade alta/média/baixa
- [x] Salvar, marcar como comprado, pré-preencher Nova Peça

### Perfil
- [x] Avatar crop circular, edição de dados, banner de plano, logout
- [ ] Redesign visual pendente

### Monetização
- [x] Stripe: checkout, webhook HMAC, customer portal
- [x] Trial 15 dias → expirado + free → TrialExpiredModal
- [x] Planos: Free e Pro (R$ 19,90/mês) — Stylist removido

### Rate Limiting
- [x] Ordem: trial ativo → ilimitado; trial expirado + free → bloqueado; Pro → limites Pro
- [x] `rateLimitResponse()` centralizado — HTTP 403 TRIAL_EXPIRED / 429 RATE_LIMITED
- [x] TrialExpiredModal em mia/page.tsx e closet/page.tsx

### Segurança
- [x] RLS em todas as tabelas
- [x] Nenhuma chave exposta no client bundle
- [x] Webhook Stripe com HMAC, SSRF protection, moderação OpenAI
- [x] Tabela tryon_predictions com RLS e ownership em /api/tryon/status

### Qualidade
- [x] npm run lint: 0 erros
- [x] npm run build: passa sem erros
- [x] next/image nos cards do closet, lookbook e detalhe
- [x] Plan = 'free' | 'pro' — Stylist removido dos tipos

---

## 3. O que está em andamento

- [ ] Redesign visual Chat da Mia
- [ ] Redesign visual Perfil
- [ ] Virtual Try-On (FASHN.ai) — tabela criada, fluxo completo pendente

---

## 4. Pendências

| Prioridade | Tarefa | Observação |
|---|---|---|
| Alta | Redesign Chat da Mia | Próxima branch |
| Alta | Redesign Perfil | Após Chat |
| Média | Finalizar Virtual Try-On | Migration 0001_tryon_predictions.sql pendente no Supabase |
| Média | Regenerar tipos após migration | npx supabase gen types typescript --linked > src/types/database.ts |
| Média | Email transacional (Resend) | Boas-vindas, trial expirando, cobrança |
| Baixa | Renomear middleware.ts → proxy.ts | Deprecado no Next 15 |
| Baixa | Histórico de outfits usados com UI | Tabela outfit_history existe, sem UI |
| Baixa | Play Store via TWA/Capacitor | — |

---

## 5. Arquivos importantes

| Arquivo | Função |
|---|---|
| `src/app/(dashboard)/closet/page.tsx` | Closet — 782 linhas |
| `src/app/(dashboard)/closet/nova-peca/page.tsx` | Nova peça — 586 linhas |
| `src/app/(dashboard)/lookbook/page.tsx` | Lookbook — 544 linhas |
| `src/app/(dashboard)/mia/page.tsx` | Chat Mia — 514 linhas |
| `src/app/(dashboard)/perfil/page.tsx` | Perfil — 490 linhas |
| `src/app/(public)/page.tsx` | Landing page |
| `src/app/(auth)/login/page.tsx` | Login — split screen |
| `src/lib/rate-limit.ts` | Rate limiting — lógica de trial/planos |
| `src/types/database.ts` | Tipos — Plan = 'free' \| 'pro' |
| `src/components/ui/TrialExpiredModal.tsx` | Modal de upgrade |
| `src/app/api/stripe/webhook/route.ts` | Webhook Stripe |
| `src/app/api/pieces/studio/route.ts` | Remove.bg |
| `src/app/api/tryon/route.ts` | FASHN.ai |
| `src/app/api/tryon/status/route.ts` | Status try-on com ownership |
| `supabase/migrations/0001_tryon_predictions.sql` | Migration pendente de rodar |
| `public/logos-mia-ai/Hero-principal.png` | Ilustração aquarela — landing e login |

---

## 6. Sistema de design

### Variáveis CSS (--ec-*)

```css
/* Édition Claire */
--ec-bg-primary:     #FAF8F5;
--ec-bg-secondary:   #F2EDE6;
--ec-bg-tertiary:    — (não definido no Claire);
--ec-accent:         #C17F5A;
--ec-accent-light:   #C4A882;
--ec-text-primary:   #1A1A1A;
--ec-text-secondary: #6B6B6B;
--ec-text-muted:     #9A8E84;
--ec-border:         #E8E2D9;
--ec-white:          #FFFFFF;

/* Dark Edition — html.mode-dark */
--ec-bg-primary:     #080808;
--ec-bg-secondary:   #111111;
--ec-bg-tertiary:    #1C1C1C;
--ec-accent:         #B8974A;
--ec-accent-light:   #D4AF6A;
--ec-text-primary:   #F0EDE8;
--ec-text-secondary: #7A7A7A;
--ec-text-muted:     #4A4A4A;
--ec-border:         #2A2A2A;
--ec-white:          #111111;
```

### Tipografia

| Modo | Títulos | Body/UI |
|---|---|---|
| Édition Claire | Cormorant Garamond 300–600 | Inter 400–500 |
| Dark Edition | Inter 300 (uppercase onde indicado) | Inter 300–500 |

### Padrões de componentes

**Botão primário:** fundo `var(--ec-accent)`, texto `#FAF8F5` (Claire) / `#080808` (Dark), border-radius 999px
**Botão outline:** borda `var(--ec-accent)`, texto `var(--ec-accent)`, hover preenchido
**Chip ativo:** fundo `var(--ec-accent)`, texto `#FAF8F5` / `#080808`
**Input:** fundo `var(--ec-bg-secondary)`, borda `var(--ec-border)`, focus `var(--ec-accent)`
**Card:** fundo `var(--ec-white)`, borda `0.5px solid var(--ec-border)`, border-radius 12px
**Fotos no grid:** `object-fit: cover`, `object-position: top`
**Fotos no detalhe:** `object-fit: contain`, fundo `var(--ec-bg-secondary)`
**Drawer desktop:** lateral direita 320px, border-left `var(--ec-border)`
**Drawer mobile:** bottom sheet, border-radius 16px 16px 0 0, handle de arrasto

---

## 7. Banco de dados

| Tabela | RLS |
|---|---|
| `profiles` | Sim |
| `pieces` | Sim |
| `outfits` | Sim |
| `outfit_history` | Sim |
| `tryon_predictions` | Sim — migration pendente de rodar |

### Colunas relevantes em `profiles`

```
plan                     'free' | 'pro'
trial_ends_at            timestamptz
usage_mia_generations    int
usage_outfit_generations int
usage_pieces_analyzed    int
usage_wishlist_generations int
usage_studio_generations int
usage_reset_at           timestamptz
stripe_customer_id       text
stripe_subscription_id   text
```

---

## 8. API Routes

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| GET | `/api/weather` | Não | Clima via Open-Meteo |
| POST | `/api/outfit/generate` | Sim | Gerar 5 outfits |
| POST | `/api/pieces/analyze` | Sim | Análise com visão computacional |
| POST | `/api/pieces/describe` | Sim | Análise multi-foto |
| POST | `/api/pieces/studio` | Sim | Foto de estúdio (Remove.bg) |
| POST | `/api/pieces/moderate` | Sim | Moderação (OpenAI) |
| POST | `/api/tryon` | Sim | Virtual Try-On (FASHN.ai) |
| GET | `/api/tryon/status` | Sim | Status com ownership |
| POST | `/api/mia/chat` | Sim | Chat com a Mia |
| POST | `/api/wishlist/generate` | Sim | Gerar wishlist |
| POST | `/api/stripe/checkout` | Sim | Criar checkout |
| POST | `/api/stripe/webhook` | HMAC | Webhook Stripe |
| POST | `/api/stripe/portal` | Sim | Portal de assinatura |

---

## 9. Variáveis de ambiente

| Variável | Escopo |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas webhook Stripe |
| `ANTHROPIC_API_KEY` | Server-side only |
| `OPENAI_API_KEY` | Server-side only |
| `REMOVE_BG_API_KEY` | Server-side only |
| `FASHN_API_KEY` | Server-side only |
| `STRIPE_SECRET_KEY` | Server-side only |
| `STRIPE_WEBHOOK_SECRET` | Server-side only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client |

---

## 10. Regras de negócio

- RLS em todas as tabelas — usuário só acessa seus próprios dados
- Toda foto passa por moderação OpenAI antes do upload
- Trial 15 dias: ilimitado. Expirado + free → TrialExpiredModal
- Pro nunca é bloqueado mesmo com trial_ends_at expirado
- Rate limiting lazy: reset na primeira chamada após 30 dias
- Plan = 'free' | 'pro' — Stylist não existe
- Modelo Anthropic: `claude-sonnet-4-6` fixo em todas as rotas
- ANTHROPIC_API_KEY nunca exposta no client bundle
- Storage público: URLs diretas sem signed URLs
- font-size: 16px nos inputs — evita zoom iOS
- maxDuration = 60 nas rotas de IA

---

## 11. Bugs conhecidos

| Bug | Impacto | Status |
|---|---|---|
| Migration tryon_predictions não rodada no Supabase | Try-on não funciona em produção | Pendente |
| Fotos adicionais na galeria não passam por moderação | Baixo | Conhecido |
| middleware.ts deprecado no Next 15 | Aviso no build | Baixo |

---

## 12. Histórico de implementações

### 2026-06-07 — v1.4.0 — Redesign Lookbook

**O que foi feito:**
- Banner/header antigo removido
- Cards com layout split: foto principal esquerda (42%) + info/thumbs direita
- Thumbs na base do card (52×52px)
- Grid 2 colunas no desktop
- Busca em tempo real por nome do outfit
- Chips de ocasião com fade nas bordas
- Drawer de filtros: Período, Ocasião, Estilo, Estação
- Toggle Dia/Noite movido para dentro do drawer
- Página de detalhe do outfit (split 50/50)
- Thumbs no detalhe trocam foto principal (não redirecionam)
- object-fit: contain no detalhe
- Sistema --ec-* aplicado nos dois modos

**Arquivos alterados:**
- `src/app/(dashboard)/lookbook/page.tsx`
- `src/app/(dashboard)/lookbook/[id]/page.tsx` (ou similar — detalhe)
- `src/app/lookbook.css` (ou equivalente)

**Próximo passo:** Redesign Chat da Mia

---

### 2026-06-07 — v1.3.0 — Redesign Closet + Correções técnicas

**O que foi feito:**
- Sistema --ec-* aplicado no closet (header, cards, drawer, chips, bottom nav)
- object-position: top nos cards do grid
- object-fit: contain no detalhe da peça
- Removido plano Stylist (Plan = 'free' | 'pro')
- Lógica de trial reescrita — expirado + free → TrialExpiredModal
- rateLimitResponse() centralizado
- 7 erros de lint corrigidos
- next/image nos cards do closet, lookbook e detalhe
- Tabela tryon_predictions + RLS + ownership

---

### 2026-06-06 — v1.2.1 — Redesign Landing + Login

**O que foi feito:**
- Sistema Édition Claire / Dark Edition na landing e login
- Toggle com persistência, variáveis --ec-*, fontes Cormorant + Inter
- Split screen no login com ilustração aquarela

---

### 2026-05-23 — v1.2.0

Remove.bg no estúdio, análise multi-foto, galeria 6 fotos, moderação OpenAI, rate limit estúdio, SSRF protection.

---

### 2026-05-22 — v1.1.0

Trial 15 dias, Virtual Try-On, foto de estúdio, redesign dashboard e closet, Nova Peça, FAQ, /sobre.

---

### 2026-05-01 — v1.0.0 — MVP

Auth, closet, lookbook, chat Mia, wishlist, perfil, Stripe, PWA, landing, deploy.
