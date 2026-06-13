# CONTEXT.md

> Memória viva do projeto. Atualizar ao final de cada implementação relevante.
> Este arquivo é a principal fonte de contexto para a IA retomar o trabalho entre sessões.

---

## 1. Estado atual do projeto

**Status:** Em produção
**Versão:** 1.7.5
**Última atualização:** 2026-06-13
**Domínio:** miaoutfitai.com.br
**Próxima ação recomendada:** Revisar relatórios CSP Report-Only; validar saída da IA com Zod (IMPORTANTE-3).

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
- [x] Tabela `piece_photos` — múltiplas fotos por peça com RLS
- [x] Seleção de capa — atualiza `is_cover` em `piece_photos` e `photo_url` em `pieces`
- [x] Análise automática com visão computacional (Mia) — badge MIA nos campos
- [x] Campos: categoria, cor primária/secundária, descrição, notas, fit, estação, estilo
- [x] Grid 1–5 colunas com persistência via localStorage
- [x] Drawer de filtros (desktop) / bottom sheet (mobile)
- [x] Chips de grupo: Todos / Roupas / Calçados / Acessórios
- [x] Peça âncora
- [x] object-position: top nos cards (não corta colarinho/ombros)
- [x] Sistema visual --ec-* aplicado

### Nova Peça (`/closet/nova-peca`)
- [x] Foto única — sem botão + para adicionar fotos adicionais
- [x] Análise automática da Mia ao adicionar foto
- [x] Botão "Foto com modelo (IA)" → FASHN product-to-model (1 crédito)
- [x] Botão "Manequim fantasma" → Photoroom Ghost Mannequin (1 crédito API)
- [x] Animação de scanner no loading (linha animada + cantos + progress bar + dots)
- [x] Dica: "Use uma foto nítida da frente da peça para melhores resultados"
- [x] TrialExpiredModal integrado
- [x] Fotos salvas em `piece_photos` no momento de salvar a peça

### Detalhe da Peça (`/closet/[id]`)
- [x] Página dedicada — modal antigo removido
- [x] Foto principal com object-fit: contain
- [x] Thumbs com badge "Capa" na foto de capa e badge ✦ nas fotos de estúdio
- [x] Clicar na thumb → troca foto principal + atualiza is_cover no banco + atualiza photo_url em pieces
- [x] Botão + nas thumbs → adiciona nova foto à peça (upload + insert em piece_photos)
- [x] Botões de estúdio (FASHN + Photoroom) — novas fotos adicionadas em piece_photos sem remover as existentes
- [x] Animação de scanner no loading
- [x] Modo visualização (padrão) — campos como texto estático
- [x] Botão "Editar" ativa campos editáveis
- [x] Botão "Salvar" faz UPDATE em pieces e volta para visualização
- [x] Botão "Cancelar" descarta alterações
- [x] Botão "Excluir peça" com confirmação e hover vermelho

### Lookbook
- [x] Cards com layout split: foto principal esquerda (42%) + info/thumbs direita
- [x] Thumbs na base do card (52×52px)
- [x] Grid 2 colunas no desktop, 1 coluna no mobile
- [x] Busca em tempo real por nome do outfit
- [x] Chips de ocasião + drawer de filtros
- [x] Página de detalhe do outfit (split 50/50)
- [x] Thumbs no detalhe trocam foto principal
- [x] Sistema --ec-* aplicado

### Outfit IA
- [x] Geração de 5 outfits com clima real
- [x] Seleção de período e ocasião
- [x] Salvar no Lookbook

### Chat Mia
- [x] Personalidade carioca, quick actions, cards inline, typing indicator
- [x] Redesign Édition Claire / Dark Edition — variáveis `--ec-*` em todos os elementos
- [x] Header com avatar, dot de status, badge de temperatura
- [x] Balões Mia/usuário, typing indicator, outfit cards inline, peça âncora
- [x] Input pill 16px com clearance para bottom nav

### Wishlist
- [x] Sugestões de IA com prioridade, salvar, marcar como comprado

### Perfil
- [x] Avatar circular com botão de edição em var(--ec-accent)
- [x] Stats 3 colunas clicáveis — Peças → closet, Outfits → lookbook
- [x] Seção Destaques — última peça + último outfit com fotos reais
- [x] Dados pessoais com edição inline ao clicar
- [x] Card de plano com badge PRO e barras de progresso de uso
- [x] Barras com cores de alerta para plano Free (warning 80%, limit 100%)
- [x] Botão "Gerenciar assinatura" outline com var(--ec-accent)
- [x] Botão "Sair da conta" com hover vermelho
- [x] Links de rodapé: Sobre · FAQ · Termos · Privacidade
- [x] Sistema visual --ec-* aplicado nos dois modos
- [x] Banner/header antigo removido

### Monetização
- [x] Stripe: checkout, webhook HMAC, customer portal
- [x] Trial 15 dias → expirado + free → TrialExpiredModal
- [x] Planos: Free e Pro (R$ 19,90/mês)

### Rate Limiting
- [x] Ordem: trial ativo → ilimitado; trial expirado + free → bloqueado; Pro → limites Pro
- [x] rateLimitResponse() — HTTP 403 TRIAL_EXPIRED / 429 RATE_LIMITED
- [x] TrialExpiredModal em mia, closet, nova-peca

### Segurança
- [x] RLS em todas as tabelas
- [x] Nenhuma chave exposta no client bundle
- [x] Moderação OpenAI fail-closed com retry (3 tentativas, 500ms) — `moderation-server.ts`
- [x] Validação Zod nos bodies das rotas de IA (8 rotas + moderate)
- [x] Tabela tryon_predictions com RLS e ownership
- [x] Erros 500 sanitizados em describe/studio/moderate/tryon — cliente recebe mensagem genérica; detalhe só em `console.error`
- [x] Security headers em `next.config.ts` (X-Frame-Options, HSTS, nosniff, Referrer-Policy, Permissions-Policy)
- [x] CSP em `Content-Security-Policy-Report-Only` (monitoramento; ainda não bloqueante)

### Qualidade
- [x] npm run lint: 0 erros
- [x] npm run build: passa sem erros
- [x] npm run test: Vitest — 16 testes (rate-limit + plan-limits)
- [x] GitHub Action CI: lint + test + build em PR/push main
- [x] next/image nos cards
- [x] Plan = 'free' | 'pro'
- [x] src/types/app.ts — tipos manuais separados do database.ts gerado

---

## 3. O que está em andamento

- Redesign visual completo ✅ — todas as páginas concluídas
- Virtual Try-On (FASHN.ai) — tabela criada, fluxo completo pendente

---

## 4. Pendências

| Prioridade | Tarefa | Observação |
|---|---|---|
| Alta | Email transacional (Resend) | Boas-vindas, trial expirando, cobrança |
| Alta | Aplicar migration 0003 no banco | `0003_secure_increment_usage.sql` — criada no repo, pendente de aplicação manual |
| Alta | Finalizar Virtual Try-On | Migration 0001_tryon_predictions.sql pendente no Supabase |
| Média | Zod na saída da IA | IMPORTANTE-3 — validar JSON retornado pelo modelo |
| Média | CSP Report-Only → bloqueante | Revisar violações reportadas; trocar header para `Content-Security-Policy` quando estável |
| Média | Build depende de env Supabase no CI | `/cadastro` e `/auth/reset-password` pré-renderizam com `createClient` — CI injeta `NEXT_PUBLIC_SUPABASE_*` via secrets. **Correção de raiz futura:** `force-dynamic` ou `createClient` só no browser |
| Média | Regenerar tipos após migration tryon | npx supabase gen types typescript --linked > src/types/database.ts |
| Média | Comprar créditos Photoroom API | Trial com marca d'água; $0.10/imagem no plano Plus |
| Baixa | Renomear middleware.ts → proxy.ts | Deprecado no Next 15 |
| Baixa | Histórico de outfits usados com UI | Tabela outfit_history existe, sem UI |
| Baixa | Play Store via TWA/Capacitor | — |

---

## 5. Arquivos importantes

| Arquivo | Função |
|---|---|
| `src/app/(dashboard)/closet/page.tsx` | Grid do closet |
| `src/app/(dashboard)/closet/nova-peca/page.tsx` | Nova peça — foto única, FASHN + Photoroom |
| `src/app/(dashboard)/closet/[id]/page.tsx` | Detalhe da peça — visualização + edição + estúdio |
| `src/app/(dashboard)/lookbook/page.tsx` | Lookbook |
| `src/app/(dashboard)/mia/page.tsx` | Chat Mia |
| `src/app/mia.css` | Estilos do chat Mia — Édition Claire / Dark Edition |
| `src/app/(dashboard)/perfil/page.tsx` | Perfil |
| `src/app/(public)/page.tsx` | Landing page |
| `src/app/(auth)/login/page.tsx` | Login — split screen |
| `src/lib/moderation-server.ts` | Moderação OpenAI com retry + fail-closed |
| `src/lib/api-schemas.ts` | Schemas Zod dos bodies das rotas de IA |
| `src/lib/parse-request-body.ts` | Helper `parseRequestBody` / `parseOptionalRequestBody` |
| `src/lib/image.ts` | Cliente de moderação — fail-closed, mensagens por motivo |
| `src/lib/rate-limit.ts` | Rate limiting — `decideRateLimit()` (pura) + `checkRateLimit()` (Supabase) |
| `src/lib/rate-limit.test.ts` | Testes unitários de `decideRateLimit` |
| `src/lib/plan-limits.test.ts` | Testes de `getUsagePercent` e `getUsageClass` |
| `.github/workflows/ci.yml` | CI: lint + test + build |
| `src/lib/plan-limits.ts` | Limites de plano e helpers de barras de uso (client-safe) |
| `src/app/perfil.css` | Estilos do perfil — Édition Claire / Dark Edition |
| `src/types/database.ts` | Tipos gerados — NÃO editar manualmente |
| `src/types/app.ts` | Tipos manuais — Plan, Profile, Piece, PiecePhoto, etc. |
| `src/components/ui/TrialExpiredModal.tsx` | Modal de upgrade |
| `src/app/api/pieces/studio/route.ts` | FASHN product-to-model |
| `src/app/api/pieces/ghost-mannequin/route.ts` | Photoroom Ghost Mannequin |
| `src/app/api/pieces/moderate/route.ts` | Moderação OpenAI |
| `src/app/api/tryon/route.ts` | FASHN Virtual Try-On |
| `src/app/api/stripe/webhook/route.ts` | Webhook Stripe |
| `supabase/schema.sql` | Fotografia do schema de produção (`supabase db dump`) — referência versionada |
| `supabase/migrations/0001_tryon_predictions.sql` | Migration pendente de rodar |
| `supabase/migrations/0002_piece_photos.sql` | Migration rodada ✅ |
| `supabase/migrations/0003_secure_increment_usage.sql` | Corrige `increment_usage` — criada, pendente de aplicação manual no banco |
| `public/logos-mia-ai/Hero-principal.png` | Ilustração aquarela — landing e login |

---

## 6. Sistema de design

### Variáveis CSS (--ec-*)

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

### Padrões de componentes

- **Botão primário:** fundo `var(--ec-accent)`, texto `#FAF8F5` (Claire) / `#080808` (Dark)
- **Botão outline:** borda `var(--ec-accent)`, hover preenchido
- **Chip ativo:** fundo `var(--ec-accent)`
- **Input:** fundo `var(--ec-bg-secondary)`, borda `var(--ec-border)`, focus `var(--ec-accent)`
- **Card:** fundo `var(--ec-white)`, borda `0.5px solid var(--ec-border)`, border-radius 12px
- **Fotos no grid:** `object-fit: cover`, `object-position: top`
- **Fotos no detalhe:** `object-fit: contain`, fundo `var(--ec-bg-secondary)`
- **Drawer desktop:** lateral direita 320px
- **Drawer mobile:** bottom sheet, border-radius 16px 16px 0 0

---

## 7. Banco de dados

| Tabela | RLS | Observação |
|---|---|---|
| `profiles` | Sim | plan = 'free' \| 'pro' |
| `pieces` | Sim | photo_url mantido para compatibilidade |
| `piece_photos` | Sim | múltiplas fotos por peça, is_cover, is_studio |
| `outfits` | Sim | — |
| `outfit_history` | Sim | sem UI ainda |
| `tryon_predictions` | Sim | migration pendente de rodar |

### Colunas relevantes em profiles

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
| POST | `/api/pieces/describe` | Sim | Análise multi-foto (rate limit `pieces_analyze`) |
| POST | `/api/pieces/studio` | Sim | FASHN product-to-model |
| POST | `/api/pieces/ghost-mannequin` | Sim | Photoroom Ghost Mannequin |
| POST | `/api/pieces/moderate` | Sim | Moderação OpenAI |
| POST | `/api/tryon` | Sim | FASHN Virtual Try-On |
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
| `REMOVE_BG_API_KEY` | Server-side only (mantido, comentado) |
| `FASHN_API_KEY` | Server-side only |
| `PHOTOROOM_API_KEY` | Server-side only |
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
- Modelo Anthropic: claude-sonnet-4-6 fixo em todas as rotas
- Storage público: URLs diretas sem signed URLs
- font-size: 16px nos inputs — evita zoom iOS
- maxDuration = 60 nas rotas de IA
- piece_photos.is_cover + pieces.photo_url mantidos em sincronia

---

## 11. Bugs conhecidos

| Bug | Impacto | Status |
|---|---|---|
| Migration tryon_predictions não rodada no Supabase | Try-on não funciona em produção | Pendente |
| middleware.ts deprecado no Next 15 | Aviso no build | Baixo |

---

## 12. Histórico de implementações

### 2026-06-13 — v1.7.5 — Auditoria Etapa 3: Zod + moderação fail-closed

**O que foi feito:**
- IMPORTANTE-5: moderação fail-closed com retry (até 3 tentativas, 500ms) em `moderation-server.ts`; rota `/api/pieces/moderate` distingue conteúdo impróprio (`flagged:true`) de indisponibilidade (`reason:'moderation_unavailable'`, HTTP 503)
- `src/lib/image.ts` e callers (closet, nova-peca, AvatarCrop) exibem mensagem correta; removido fail-open no catch de nova-peca
- IMPORTANTE-4 (parcial): Zod nos bodies de `outfit/generate`, `wishlist/generate`, `mia/chat`, `mia/extract-date`, `pieces/analyze`, `pieces/describe`, `tryon`, `pieces/moderate` — 400 genérico ao cliente, detalhe logado no servidor

**Pendente (auditoria):**
- IMPORTANTE-3: Zod na saída da IA (JSON parse das respostas Anthropic)
- CSP Report-Only → bloqueante após revisão

**Próximo passo:** validar moderação em produção → Zod na saída da IA

---

### 2026-06-12 — v1.7.4 — Auditoria Etapa 3 (mecânica)

**O que foi feito:**
- Erros 500 sanitizados: `pieces/describe`, `pieces/studio`, `pieces/moderate` e `tryon` retornam `{ error: 'Erro interno' }` ao cliente; `console.error` mantém detalhe no servidor; removido `detail` da resposta FASHN em tryon
- Security headers globais em `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy
- CSP inicial em `Content-Security-Policy-Report-Only` (Supabase storage, Stripe, GA/GTM, inline Next) — comentário no código: virar bloqueante só após validar relatórios

**Pendente (auditoria Etapa 3):**
- Moderação fail-closed (decisão de produto, tratado à parte)
- Zod nos bodies e na saída da IA
- Promover CSP de Report-Only para bloqueante

**Próximo passo:** revisar CSP em produção → fail-closed moderação ou Zod

---

### 2026-06-12 — v1.7.3 — Auditoria Etapa 2: Vitest + CI

**O que foi feito:**
- CRÍTICO-2 (parcial): Vitest instalado; scripts `test` e `test:watch`; `vitest.config.ts`
- Lógica pura extraída: `decideRateLimit(profile, action, now)` em `rate-limit.ts` — `checkRateLimit()` continua lendo/atualizando Supabase; assinaturas públicas inalteradas
- 16 testes unitários: `rate-limit.test.ts` (8 cenários incl. borda do reset de 30 dias) + `plan-limits.test.ts` (8 cenários)
- `.github/workflows/ci.yml` — Node 20, `npm ci`, lint, test, build em PR e push para main

**Pendente (auditoria):**
- CRÍTICO-2 restante: expandir cobertura (webhook Stripe, parsing de IA) — fora do escopo desta sessão
- Aplicar migration 0003 no banco (Etapa 1)

**Próximo passo:** aplicar 0003 → email transacional ou Virtual Try-On

---

### 2026-06-12 — v1.7.2 — Auditoria: schema versionado + increment_usage seguro

**O que foi feito:**
- CRÍTICO-1: `supabase/schema.sql` adicionado ao repositório — dump completo do schema de produção (tabelas, RLS, grants, funções)
- IMPORTANTE-1: `supabase/migrations/0003_secure_increment_usage.sql` — `increment_usage` passa a usar `auth.uid()` internamente (parâmetro `user_id` mantido na assinatura por compatibilidade, mas ignorado), lista branca de colunas, `SET search_path = public`, `REVOKE` da role `anon`

**Pendente:**
- Aplicar `0003_secure_increment_usage.sql` manualmente no banco (SQL Editor ou `psql`) — migration criada no repo, **não aplicada automaticamente**
- Após aplicar: testar incremento de contador via app (ex.: análise de peça) e confirmar que chamada com `user_id` de outro usuário falha

**Próximo passo:** aplicar 0003 em produção → commitar `schema.sql` + migration

---

### 2026-06-12 — v1.7.1 — Auditoria: rate limit describe + schema pendente

**O que foi feito:**
- IMPORTANTE-2: `POST /api/pieces/describe` passou a usar `checkRateLimit(user.id, 'pieces_analyze')` após `getUser` e `incrementUsage` no sucesso — mesmo padrão de `/api/pieces/analyze`
- CRÍTICO-1: tentativa de `supabase db pull` bloqueada (CLI não instalado no ambiente do agente). Passo a passo documentado abaixo para o dev rodar localmente

**Pendente (auditoria):**
- CRÍTICO-1: commitar `supabase/migrations/0000_initial_schema.sql` com tabelas centrais, RLS e `increment_usage`
- IMPORTANTE-1: revisar função `increment_usage` após o pull (validação `auth.uid()` + colunas permitidas)
- CRÍTICO-2: testes automatizados + CI (fora do escopo desta sessão)

**Como versionar o schema (rodar no seu terminal):**
```bash
# 1. Instalar CLI (Linux)
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh

# 2. Login (abre o browser)
supabase login

# 3. Linkar ao projeto remoto (ref já conhecido: qeblfxlyrkiwucrwmydk)
cd /caminho/outfit-saas
supabase link --project-ref qeblfxlyrkiwucrwmydk

# 4. Puxar schema remoto → gera migration em supabase/migrations/
supabase db pull

# 5. Renomear a migration gerada para 0000_initial_schema.sql
#    (antes de 0001_tryon_predictions.sql e 0002_piece_photos.sql)
# 6. Revisar increment_usage no arquivo e commitar
```

**Próximo passo:** concluir CRÍTICO-1 localmente → revisar IMPORTANTE-1

---

### 2026-06-08 — v1.7.0 — Redesign Perfil + Correções

**O que foi feito:**
- Página de perfil redesenhada — banner/header antigo removido
- Avatar com botão de edição em var(--ec-accent)
- Stats 3 colunas clicáveis (Peças → closet, Outfits → lookbook)
- Seção Destaques com última peça + último outfit (dados reais do banco)
- Dados pessoais com edição inline
- Card de plano com barras de progresso de uso (análises, outfits, chat, estúdio)
- Sistema --ec-* aplicado nos dois modos
- Correção: modal de onboarding aparecia sempre — CSS restaurado + timing da condição corrigido
- Helper isProfileBodyIncomplete() trata null/undefined/string vazia
- onboarding só abre após profile carregar e height/weight estarem vazios

**Próximo passo:** Email transacional via Resend + Virtual Try-On

---

### 2026-06-08 — v1.6.0 — Redesign Chat da Mia

**O que foi feito:**
- Redesign completo do chat com sistema `--ec-*` (Édition Claire + Dark Edition)
- Header: avatar com dot de status, tipografia Cormorant/Inter, badge de temperatura
- Quick actions com chips, hover/active e fade nas bordas
- Balões Mia e usuário, typing indicator animado, outfit/wishlist cards inline
- Input pill 16px, botão de envio circular, clearance para bottom nav
- Variável `--bottom-nav-height` no dashboard.css

**Próximo passo:** Redesign Perfil

---

### 2026-06-08 — v1.5.0 — Detalhe da Peça + Nova Peça + Estúdio

**O que foi feito:**
- Página dedicada `/closet/[id]` substituiu o modal de detalhe
- Modo visualização + edição opcional no detalhe
- Thumbs com badge "Capa" e badge ✦ para fotos de estúdio
- Clicar na thumb troca foto principal + atualiza is_cover + atualiza photo_url
- Botão + nas thumbs para adicionar fotos à peça existente
- Botões FASHN e Photoroom no detalhe — novas fotos adicionadas sem remover existentes
- Nova Peça simplificada — foto única, sem botão +
- FASHN product-to-model integrado (1 crédito/geração)
- Photoroom Ghost Mannequin integrado (1 crédito API/$0.10)
- Animação de scanner no loading dos dois botões de estúdio
- Remove.bg mantido comentado como fallback
- Correção: studio megapixels (sharp resize antes do Remove.bg)
- Correção: studioLoading com finally
- Correção: TrialExpiredModal na Nova Peça
- Tabela piece_photos com migration 0002_piece_photos.sql
- src/types/app.ts separado do database.ts gerado

**Próximo passo:** Redesign Chat da Mia

---

### 2026-06-07 — v1.4.0 — Redesign Lookbook

Cards split, grid 2 colunas, busca, drawer de filtros, página de detalhe do outfit, thumbs trocam foto principal.

---

### 2026-06-07 — v1.3.0 — Redesign Closet + Correções técnicas

Sistema --ec-* no closet, object-position: top, object-fit: contain, Stylist removido, lógica de trial, lint, next/image, tryon_predictions.

---

### 2026-06-06 — v1.2.1 — Redesign Landing + Login

Édition Claire / Dark Edition na landing e login, split screen, ilustração aquarela.

---

### 2026-05-23 — v1.2.0

Remove.bg, análise multi-foto, galeria, moderação OpenAI, SSRF protection.

---

### 2026-05-22 — v1.1.0

Trial, FASHN Try-On, foto de estúdio, redesign dashboard, Nova Peça, FAQ, /sobre.

---

### 2026-05-01 — v1.0.0 — MVP

Auth, closet, lookbook, chat Mia, wishlist, perfil, Stripe, PWA, landing, deploy.
