# CONTEXT.md

> Memória viva do projeto. Atualizar ao final de cada implementação relevante.
> Este arquivo é a principal fonte de contexto para a IA retomar o trabalho entre sessões.

---

## 1. Estado atual do projeto

**Status:** Em produção
**Versão:** 1.3.0
**Última atualização:** 2026-06-07
**Domínio:** miaoutfitai.com.br
**Próxima ação recomendada:** Redesign visual do app interno (closet, lookbook, chat Mia, perfil) seguindo o sistema de design Édition Claire / Dark Edition já implementado na landing e login.

---

## 2. O que já está funcionando

### Infraestrutura
- [x] Next.js 16 App Router + TypeScript + Tailwind CSS v4
- [x] Supabase (PostgreSQL + Auth + Storage) — região São Paulo
- [x] Vercel — domínio miaoutfitai.com.br com redirect www → sem www (308)
- [x] PWA completo (service worker `/sw.js`, manifest, instalação Android e iOS)
- [x] Google Analytics (G-BE79RBHKKT)

### Autenticação
- [x] Login email/senha + Google OAuth
- [x] Recuperação de senha (`/esqueci-senha`) e confirmação de e-mail
- [x] Trigger automático de criação de perfil no cadastro
- [x] Middleware de proteção de rotas autenticadas (`src/middleware.ts`)

### Sistema visual (landing + auth)
- [x] Dois modos visuais: Édition Claire (claro) e Dark Edition (escuro)
- [x] Toggle pill "Édition Claire / Dark Edition" com persistência em `localStorage` (`mia-mode`)
- [x] Variáveis CSS `--ec-*` para todos os elementos — troca de modo via classe `html.mode-dark`
- [x] Landing page redesenhada nos dois modos (`/landing`, desktop + mobile)
- [x] Página de login/cadastro com split screen 60/40 (ilustração + formulário)
- [x] Página `/sobre` no padrão Édition Claire
- [x] Fontes: Cormorant Garamond (Claire) + Inter 300 (Dark)
- [x] `ModeToggle` no closet (componente reutilizável em `src/components/ui/ModeToggle.tsx`)

### Closet
- [x] CRUD de peças com upload de foto e compressão automática
- [x] Galeria de até 6 fotos por peça com seleção de capa (Nova Peça)
- [x] Análise automática de peças com visão computacional (Mia) — badge MIA nos campos
- [x] Campos: categoria, cor primária, cor secundária, descrição, notas, fit, estação, estilo
- [x] Grid 1–5 colunas com persistência via localStorage
- [x] Drawer de filtros (desktop) / bottom sheet (mobile)
- [x] Chips de grupo: Todos / Roupas / Calçados / Acessórios
- [x] Peça âncora (fixar uma peça para gerar outfits a partir dela — `sessionStorage`)
- [x] Foto de estúdio com fundo branco (Remove.bg)
- [x] Virtual Try-On com FASHN.ai (seleção múltipla e sequencial)
- [x] Moderação de conteúdo com OpenAI Moderation API antes de qualquer upload
- [x] Tour guiado do closet (exibido uma vez após onboarding — `closet_tour_completed`)
- [x] `object-position: top` nos cards (não corta colarinho/ombros)
- [x] `object-fit: contain` no detalhe (peça inteira visível)

### Outfit IA
- [x] Geração de 5 outfits por vez com clima real (Open-Meteo + geolocalização)
- [x] Seleção de período do dia e ocasião
- [x] Bloqueio de peças já usadas entre gerações
- [x] Salvar outfits no Lookbook

### Lookbook
- [x] Outfits salvos com filtros por período e ocasião
- [x] Modal de detalhe e exclusão

### Chat Mia
- [x] Personalidade carioca definida
- [x] Quick actions
- [x] Cards de outfit inline
- [x] Typing indicator
- [x] Suporte a data futura para planejamento de looks (`/api/mia/extract-date`)
- [x] Peça âncora no chat

### Wishlist
- [x] Sugestões de IA baseadas no closet atual
- [x] Prioridade alta/média/baixa
- [x] Salvar e marcar como comprado
- [x] Pré-preencher Nova Peça a partir da wishlist

### Perfil
- [x] Avatar com crop circular (400×400 JPEG)
- [x] Edição de nome, altura, peso, estilo
- [x] Banner de plano com trial restante
- [x] Checkout Stripe server-side (`/api/stripe/checkout`) e portal de assinatura
- [x] Logout

### Monetização
- [x] Stripe: checkout, webhook com validação HMAC
- [x] Portal de gerenciamento de assinatura (Stripe Customer Portal)
- [x] Trial de 15 dias — após expirar, usuário vê `TrialExpiredModal` e é bloqueado
- [x] Planos: Free (limitado) e Pro (R$ 19,90/mês)
- [x] Plano Stylist removido — não existe mais nos tipos nem no rate limit

### Rate Limiting
- [x] Colunas `usage_*` na tabela `profiles` com reset a cada 30 dias (lazy)
- [x] Ordem de verificação: trial ativo → ilimitado; trial expirado + free → bloqueado; Pro → limites Pro; free sem trial → limites restritos
- [x] `rateLimitResponse()` centralizado — HTTP 403 + `code: 'TRIAL_EXPIRED'` ou 429 + `code: 'RATE_LIMITED'`
- [x] `TrialExpiredModal` em `mia/page.tsx` e `closet/page.tsx`

### Segurança
- [x] RLS ativo em todas as tabelas Supabase
- [x] Nenhuma chave de API exposta no client bundle
- [x] Webhook Stripe valida assinatura HMAC
- [x] SSRF protection na rota de estúdio (valida hostname Supabase)
- [x] Moderação de conteúdo antes de upload
- [x] Tabela `tryon_predictions` com RLS — ownership validado em `/api/tryon/status`

### Qualidade de código
- [x] `npm run lint`: 0 erros (`react-hooks/set-state-in-effect` rebaixado para warn)
- [x] `npm run build`: passa sem erros
- [x] `next/image` nos cards do closet, lookbook e `PieceDetailModal`
- [x] `Plan = 'free' | 'pro'` — Stylist removido dos tipos

---

## 3. O que está em andamento

- [ ] Redesign visual do app interno — sistema `--ec-*` parcialmente aplicado (closet/nova-peça), mas lookbook, chat Mia e perfil ainda no tema dark legado
- [ ] Virtual Try-On (FASHN.ai) — tabela `tryon_predictions` criada, ownership implementado, mas migration ainda não rodada em produção

---

## 4. Pendências e próximos passos

| Prioridade | Tarefa | Observação |
|---|---|---|
| Alta | Redesign closet (grid, drawer, detalhe, nova peça) | Aguarda spec |
| Alta | Redesign lookbook | Aguarda spec |
| Alta | Redesign chat Mia | Aguarda spec |
| Alta | Redesign perfil | Aguarda spec |
| Média | Finalizar Virtual Try-On | Tabela criada, rodar migration e testar fluxo completo |
| Média | Rodar migration `tryon_predictions` no Supabase | `supabase/migrations/0001_tryon_predictions.sql` |
| Média | Regenerar tipos após migration | `npx supabase gen types typescript --linked > src/types/database.ts` |
| Média | Email transacional via Resend | Boas-vindas, trial expirando, cobrança |
| Baixa | Renomear `middleware.ts` → `proxy.ts` | Deprecado no Next 16, emite aviso no build |
| Baixa | Histórico de outfits usados com UI | Tabela `outfit_history` existe, sem UI ainda |
| Baixa | Publicação na Play Store via TWA/Capacitor | — |

---

## 5. Arquivos importantes

| Arquivo / Pasta | Função |
|---|---|
| `src/app/(dashboard)/closet/page.tsx` | Closet — 794 linhas, candidato a refatoração |
| `src/app/(dashboard)/closet/nova-peca/page.tsx` | Adicionar nova peça — 586 linhas |
| `src/app/(dashboard)/lookbook/page.tsx` | Lookbook — 545 linhas |
| `src/app/(dashboard)/mia/page.tsx` | Chat com a Mia — 526 linhas |
| `src/app/(dashboard)/perfil/page.tsx` | Perfil do usuário — 490 linhas |
| `src/app/landing/page.tsx` | Landing page |
| `src/app/(auth)/login/page.tsx` | Login — split screen com ilustração |
| `src/app/(auth)/cadastro/page.tsx` | Cadastro — mesma estrutura do login |
| `src/lib/rate-limit.ts` | Rate limiting centralizado — lógica de trial/planos |
| `src/lib/supabase/client.ts` | Conexão client-side |
| `src/lib/supabase/server.ts` | Conexão server-side |
| `src/middleware.ts` | Proteção de rotas — deprecado, renomear para `proxy.ts` |
| `src/types/database.ts` | Tipos TypeScript do banco — `Plan = 'free' \| 'pro'` |
| `src/components/ui/TrialExpiredModal.tsx` | Modal de upgrade pós-trial |
| `src/components/ui/ModeToggle.tsx` | Toggle Édition Claire / Dark Edition |
| `src/app/api/stripe/webhook/route.ts` | Webhook Stripe com validação HMAC |
| `src/app/api/pieces/studio/route.ts` | Remove.bg — foto de estúdio |
| `src/app/api/pieces/moderate/route.ts` | OpenAI Moderation |
| `src/app/api/tryon/route.ts` | FASHN.ai — Virtual Try-On |
| `src/app/api/tryon/status/route.ts` | Status do try-on — com ownership |
| `supabase/migrations/` | Migrations — incluindo `0001_tryon_predictions.sql` (pendente de rodar) |
| `public/illustrations/Hero-principal.png` | Ilustração aquarela usada na landing e login |

---

## 6. Sistema de design

### Variáveis CSS (`--ec-*`)

Definidas no `:root` (Édition Claire) e sobrescritas em `html.mode-dark` (Dark Edition) — ver `src/app/globals.css`.

```css
/* Édition Claire */
--ec-bg-primary:     #FAF8F5;
--ec-bg-secondary:   #F2EDE6;
--ec-accent:         #C17F5A;
--ec-accent-light:   #C4A882;
--ec-text-primary:   #1A1A1A;
--ec-text-secondary: #6B6B6B;
--ec-text-muted:     #9A8E84;
--ec-border:         #E8E2D9;
--ec-white:          #FFFFFF;

/* Dark Edition */
--ec-bg-primary:     #080808;
--ec-bg-secondary:   #111111;
--ec-accent:         #B8974A;
--ec-accent-light:   #D4AF6A;
--ec-text-primary:   #F0EDE8;
--ec-text-secondary: #7A7A7A;
--ec-text-muted:     #4A4A4A;
--ec-border:         #2A2A2A;
--ec-white:          #111111;
```

### Tipografia

| Modo | Display/Títulos | Body/UI |
|---|---|---|
| Édition Claire | Cormorant Garamond 300–600 | Inter 400–500 |
| Dark Edition | Inter 300 uppercase | Inter 300–500 |

### Toggle de modo

```javascript
// Salvar preferência
localStorage.setItem('mia-mode', 'claire' | 'dark')

// Aplicar modo
document.documentElement.classList.toggle('mode-dark', mode === 'dark')
```

---

## 7. Banco de dados

| Tabela | Descrição | RLS |
|---|---|---|
| `profiles` | Dados do usuário, plano, trial, `usage_*`, avatar | Sim |
| `pieces` | Peças do closet com fotos, categoria, análise da Mia | Sim |
| `outfits` | Combinações salvas com tags e "por que funciona" | Sim |
| `outfit_history` | Histórico de outfits usados | Sim |
| `wishlist_items` | Itens da wishlist com prioridade e status de compra | Sim |
| `tryon_predictions` | Predictions do FASHN.ai com ownership | Sim (migration pendente) |

### Colunas relevantes em `profiles`

```sql
plan                      'free' | 'pro'
trial_ends_at             timestamptz
usage_mia_generations     int
usage_outfit_generations  int
usage_pieces_analyzed     int
usage_wishlist_generations int
usage_studio_generations  int
usage_reset_at            timestamptz
stripe_customer_id        text
stripe_subscription_id    text
plan_expires_at           timestamptz
closet_tour_completed     boolean
```

> **Nota:** `usage_studio_generations` é usada em `rate-limit.ts` mas ainda não está no tipo `Profile` em `database.ts` — regenerar tipos após confirmar schema no Supabase.

---

## 8. API Routes

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| GET | `/api/weather` | Não | Clima via Open-Meteo |
| POST | `/api/outfit/generate` | Sim | Gerar 5 outfits com IA |
| POST | `/api/pieces/analyze` | Sim | Análise de peça com visão computacional |
| POST | `/api/pieces/describe` | Sim | Análise multi-foto |
| POST | `/api/pieces/studio` | Sim | Foto de estúdio (Remove.bg) |
| POST | `/api/pieces/moderate` | Sim | Moderação de conteúdo (OpenAI) |
| POST | `/api/tryon` | Sim | Virtual Try-On (FASHN.ai) |
| GET | `/api/tryon/status` | Sim | Status do try-on — valida ownership |
| POST | `/api/mia/chat` | Sim | Chat com a Mia |
| POST | `/api/mia/extract-date` | Sim | Extrai data futura de mensagem do usuário |
| POST | `/api/wishlist/generate` | Sim | Gerar sugestões de wishlist |
| POST | `/api/stripe/checkout` | Sim | Criar sessão de checkout |
| POST | `/api/stripe/webhook` | HMAC | Webhook Stripe |
| POST | `/api/stripe/portal` | Sim | Portal de gerenciamento de assinatura |

---

## 9. Variáveis de ambiente

| Variável | Escopo | Configurada |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas webhook Stripe | ✅ |
| `ANTHROPIC_API_KEY` | Server-side only | ✅ |
| `OPENAI_API_KEY` | Server-side only | ✅ |
| `REMOVE_BG_API_KEY` | Server-side only | ✅ |
| `FASHN_API_KEY` | Server-side only | ✅ |
| `STRIPE_SECRET_KEY` | Server-side only | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Server-side only | ✅ |
| `STRIPE_PRICE_ID` | Server-side only | ✅ |
| `NEXT_PUBLIC_APP_URL` | Client + Server | ✅ |

> Checkout Stripe é 100% server-side — não há `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no projeto.

---

## 10. Regras de negócio

- Usuário só acessa seus próprios dados (RLS em todas as tabelas)
- Toda foto passa por moderação OpenAI antes do upload
- Trial de 15 dias: acesso ilimitado. Após expirar com plano free → bloqueado (`TrialExpiredModal`)
- Usuário Pro nunca é bloqueado, mesmo com `trial_ends_at` expirado
- Rate limiting lazy: reset na primeira chamada após 30 dias (sem cron job)
- Plano Stylist não existe — `Plan = 'free' | 'pro'` apenas
- Modelo Anthropic fixo: `claude-sonnet-4-6` — atualizar requer revisar todas as rotas
- `ANTHROPIC_API_KEY` nunca exposta no client bundle
- `SUPABASE_SERVICE_ROLE_KEY` usada apenas no webhook do Stripe
- Storage público: URLs diretas sem signed URLs (aceito para fotos de moda)
- `font-size: 16px` nos inputs — evita zoom automático no iOS
- `maxDuration` configurado nas rotas de IA: estúdio 60s, análise 30s

---

## 11. Bugs conhecidos

| Bug | Impacto | Status |
|---|---|---|
| Migration `tryon_predictions` não rodada no Supabase | Try-on não funciona em produção | Pendente |
| Fotos adicionais na galeria não passam por moderação | Baixo | Conhecido |
| `middleware.ts` deprecado no Next 16 | Aviso no build | Baixo |
| ~170 linhas de código comentado em `studio/route.ts` | Leitura | Baixo |
| `usage_studio_generations` ausente em `database.ts` | Tipos desatualizados | Conhecido |

---

## 12. Decisões técnicas relevantes

| Data | Decisão | Impacto |
|---|---|---|
| 2026-05-01 | Supabase como banco, auth e storage | Migrar seria custoso |
| 2026-05-01 | App Router do Next.js (nunca Pages Router) | Sem compatibilidade Pages Router |
| 2026-05-01 | Storage público sem signed URLs | URLs diretas acessíveis — aceito |
| 2026-05-22 | Remove.bg para foto de estúdio | 100% fidelidade ao produto original |
| 2026-05-23 | OpenAI Moderation falha-aberta | Upload permitido se API indisponível |
| 2026-06-07 | Plano Stylist removido — apenas free/pro | Tipos limpos, rate limit correto |
| 2026-06-07 | Trial expirado bloqueia totalmente | Usuário free pós-trial vê modal de upgrade |
| 2026-06-07 | `react-hooks/set-state-in-effect` como warn | `setMounted` em `useEffect` é padrão legítimo |

---

## 13. Como rodar o projeto localmente

```bash
npm install
cp .env.example .env.local
# Preencher os valores em .env.local

PATH="/home/marcos-ranauro/.nvm/versions/node/v20.20.2/bin:$PATH" npm run dev
# http://localhost:3000

npm run lint    # deve retornar 0 erros
npm run build   # deve passar sem erros
```

---

## 14. Histórico de implementações

### 2026-06-07 — Correções técnicas pós-auditoria + CSS dos cards

**O que foi feito:**
- Removido plano Stylist dos tipos e rate limit (`Plan = 'free' | 'pro'`)
- Reescrita lógica de trial: expirado + free → bloqueado com `TrialExpiredModal`
- `rateLimitResponse()` centralizado com `TRIAL_EXPIRED` e `RATE_LIMITED`
- `TrialExpiredModal` implementado (Édition Claire + Dark Edition)
- 7 erros de lint corrigidos (`set-state-in-effect` → warn)
- `next/image` nos cards do closet, lookbook e `PieceDetailModal`
- Tabela `tryon_predictions` + RLS + ownership em `/api/tryon/status`
- `object-position: top` nos cards do grid (não corta colarinho)
- `object-fit: contain` no detalhe da peça (peça inteira visível)
- `CONTEXT.md` criado/atualizado com estado real do projeto

**Arquivos alterados:**
- `src/types/database.ts` — Plan sem `'stylist'`
- `src/lib/rate-limit.ts` — lógica de trial reescrita
- `src/app/api/mia/chat/route.ts` — usa `rateLimitResponse()`
- `src/app/api/outfit/generate/route.ts` — usa `rateLimitResponse()`
- `src/app/api/pieces/analyze/route.ts` — usa `rateLimitResponse()`
- `src/app/api/pieces/studio/route.ts` — usa `rateLimitResponse()`
- `src/app/api/wishlist/generate/route.ts` — usa `rateLimitResponse()`
- `src/app/(dashboard)/mia/page.tsx` — `TrialExpiredModal` wired
- `src/app/(dashboard)/closet/page.tsx` — `TrialExpiredModal` + `ModeToggle`
- `src/app/api/tryon/route.ts` — registra prediction no banco
- `src/app/api/tryon/status/route.ts` — valida ownership
- `src/app/closet.css` — `object-position: top` no grid, `object-fit: contain` no detalhe
- `eslint.config.mjs` — `set-state-in-effect` como warn
- `next.config.ts` — `remotePatterns` para `*.supabase.co`

**Arquivos criados:**
- `src/components/ui/TrialExpiredModal.tsx`
- `src/components/ui/ModeToggle.tsx`
- `supabase/migrations/0001_tryon_predictions.sql`
- `CONTEXT.md`

**Pendências deixadas:**
- Migration `0001_tryon_predictions.sql` ainda não rodada no Supabase
- Regenerar tipos após rodar a migration

**Próximo passo recomendado:**
Redesign visual do app interno começando pelo closet.

---

### 2026-06-06 — Redesign landing + login

**O que foi feito:**
Sistema visual Édition Claire / Dark Edition implementado na landing e login. Toggle com persistência, variáveis `--ec-*`, fontes Cormorant + Inter, split screen no login com a ilustração aquarela.

**Próximo passo recomendado:**
Aplicar sistema `--ec-*` no app interno (closet, lookbook, mia, perfil).

---

### 2026-05-23 — v1.2.0

**O que foi feito:**
Remove.bg no estúdio, análise multi-foto, galeria 6 fotos, moderação OpenAI, rate limit estúdio, SSRF protection.

---

### 2026-05-22 — v1.1.0

**O que foi feito:**
Trial 15 dias, Virtual Try-On FASHN.ai, foto de estúdio, redesign dashboard e closet, página Nova Peça, FAQ, `/sobre`.

---

### 2026-05-01 — v1.0.0 — MVP

**O que foi feito:**
Auth completo, closet, lookbook, chat Mia, wishlist, perfil, Stripe, PWA, landing, deploy em miaoutfitai.com.br.
