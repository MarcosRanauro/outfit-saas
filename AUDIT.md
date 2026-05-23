# Auditoria Técnica — Outfit SaaS (Mia Outfit AI)

**Data:** 2026-05-22  
**Branch auditada:** `feat/studio-cost-optimization` (baseada em `main`)  
**Atualizado:** 2026-05-23 — limpeza de código em `fix/code-cleanup`: logs debug removidos, tipos `any` corrigidos  
**Auditor:** Claude Sonnet 4.6

---

## Mudanças pós-auditoria

### Features implementadas desde a auditoria

- **Foto de estúdio com Remove.bg** — remoção de fundo com fidelidade 100% à foto real; `bg_color: ffffff` aplicado diretamente pela API; `sharp` usado apenas para resize 1024×1024. Histórico de implementações comentado no código: gpt-image-1 → Photoroom → Fal.ai → Remove.bg (atual).
- **Multi-foto com análise via Mia** — nova rota `/api/pieces/describe` envia até 3 fotos para `claude-sonnet-4-6` e retorna descrição técnica visual em inglês que enriquece o prompt de geração.
- **Nova Peça redesenhada** — galeria de até 6 fotos, seleção de capa, análise automática, campos expandidos (`color_secondary`, `description`, `notes`), modal de confirmação centralizado, modal de loading com spinner, dica de foto.
- **Persistência de colunas do closet** — seletor de 1–5 colunas salvo em `localStorage`, restaurado sem hydration mismatch via `useEffect`.
- **Trial de 15 dias** — coluna `trial_ends_at` no banco, lógica de expiração no rate limit, banner no perfil com dias restantes.
- **Virtual Try-On** — seleção múltipla sequencial de peças, polling com limite, integração FASHN.ai.

### Itens resolvidos

| Item | Status |
|---|---|
| SSRF em `/api/pieces/studio` | ✅ Corrigido — validação de hostname |
| Rate limiting em `/api/pieces/studio` | ✅ Corrigido — `studio_generate` 10/mês free |
| Logs de debug em produção | ✅ Corrigido — todos removidos |
| CSS inline (`style={{}}`) | ✅ Migrado para classes CSS em `fix/css-inline` |
| Tipos `any` em closet, perfil, mia/chat, webhook | ✅ Corrigido em `fix/code-cleanup` |

---

## 1. Status por Funcionalidade

### ✅ Auth — login, cadastro, Google OAuth, recuperação de senha
Fluxo completo e funcional. Confirmação de e-mail tratada corretamente (`data.session === null`). Toggle de tema sincronizado com `localStorage`. Google OAuth redireciona para `/auth/callback` corretamente.

**Ressalva menor:** links internos nos formulários (`/cadastro`, `/login`, `/esqueci-senha`) usam `<a href>` nativo em vez de `<Link>` do Next.js — causa full page reload desnecessário no mobile.

---

### ✅ Closet — listagem, filtros, seletor de colunas, busca, cards
Grid responsivo de 1 a 5 colunas com persistência em `localStorage`. Busca por nome/categoria/cor. Filtros dinâmicos (só exibe seções que têm dados reais no closet). Chips de grupo. Peça âncora com badge dourado. Tour guiado com spotlight.

**Ressalva:** `uniqueValues()` percorre o array de peças completo a cada render. Com closets grandes (500+ peças) pode causar lentidão — memoizar com `useMemo`.

---

### ✅ Nova Peça — upload, análise Mia, múltiplas fotos, galeria, salvar
Análise automática ao selecionar foto. Galeria com até 6 fotos. Compressão antes do upload. Campos preenchidos pela Mia com badge dourado. Salva todos os campos novos (`color_secondary`, `description`, `notes`).

**Ressalva:** se `getUser()` falhar no meio de `handleGenerateStudio`, o early return não aciona `setStudioLoading(false)` — UI fica travada no estado de loading.

---

### ✅ Foto de estúdio — geração, 4 ângulos, seleção de capa
Funcional. Configuração: `gpt-image-1` + `quality: low` + `1024×1024` (~$0.044/geração). Rate limiting ativo (`studio_generate`: 10/mês free, 999/mês pro). SSRF corrigido — `photo_url` validada contra o host do Supabase Storage antes do `fetch()`. Console.logs de diagnóstico removidos.

---

### ✅ Lookbook — listagem, filtros, salvar outfits
Filtros por período (dia/noite) e ocasião. Cards com até 3 fotos de peças + badge `+N`. Modal de detalhe com lista completa de peças e "Por que funciona". Exclusão de outfit.

**Ressalva:** link "Ir para Outfit IA" no estado vazio aponta para `/outfit-ia`, que é apenas um redirect para `/mia`. Funciona mas gera um redirect desnecessário — deveria apontar diretamente para `/mia`.

---

### ⚠️ Virtual Try-On
Funcional, mas visível apenas para `plan === 'pro'`. **Usuários em trial ativo não têm acesso**, mesmo tendo acesso ilimitado às outras features de IA. Inconsistência de regra de produto.

Polling a cada 1 segundo sem exponential backoff — 30 tentativas × 1s = 30s máximo, sem feedback visual de progresso além do spinner genérico.

`console.log('[tryon] API Key prefix:', ...)` em produção — expõe os primeiros 8 caracteres da `FASHN_API_KEY` nos logs da Vercel.

---

### ✅ Mia — chat, quick actions, cards de outfit
Chat funcional com histórico de contexto, clima atual, peça âncora e suporte a data futura via `extract-date`. Cards de outfit e wishlist renderizados dentro das bolhas. Typing indicator. Scroll automático.

**Ressalva:** `savedOutfitIds` e `savedWishlistIds` vivem apenas em memória — ao recarregar a página, outfits já salvos não mostram o estado "✓ Salvo". Não é um bug crítico mas pode causar duplicatas se o usuário salvar novamente.

---

### ✅ Perfil — dados, avatar, plano
Edição inline de nome, altura, peso e estilo. Crop circular de avatar (400×400, JPEG). Contador real de peças e outfits. Banner de trial com dias restantes. Botão de upgrade / portal de assinatura.

**Ressalva:** `handleSave` usa `updateData: any` — tipo fraco que poderia causar erros silenciosos se um campo inválido for passado.

---

### ✅ Wishlist — sugestões, salvar, marcar como comprado
Sugestões via IA com prioridade (Essencial / Recomendado / Opcional). Salvar na wishlist, ver lista, marcar como comprado (abre modal de nova peça pré-preenchido), remover. IA não sugere peças já presentes no closet nem na wishlist.

---

### ✅ Stripe — checkout, portal, webhook
Checkout cria customer Stripe, salva `stripe_customer_id`, redireciona para sessão. Webhook valida assinatura antes de processar. Trata `invoice.payment_succeeded`, `customer.subscription.deleted` e `invoice.payment_failed`. Portal de gerenciamento funcional.

**Ressalva:** `(invoice as any).subscription` e `(invoice as any).lines` — o SDK do Stripe tem tipagens para esses campos; o cast para `any` mascara erros em tempo de compilação.

---

### ✅ PWA — instalação, service worker, ícones
Service worker com estratégia network-first. Página offline estática. Botão de instalação Android (`beforeinstallprompt`) e instrução iOS Safari. Manifest com `start_url`, `id`, screenshots, orientação, lang.

---

### ✅ Bottom nav
Cores dinâmicas via `MutationObserver` em `data-theme`. Ícone especial para Mia (✦ dourado circular). Highlight da rota ativa.

---

### ✅ Tema claro/escuro
Persistido em `localStorage` (`mia_theme`). `data-theme` e `data-auth-theme` sincronizados. Script inline no `layout.tsx` evita flash de tema ao carregar.

---

## 2. CSS Inline (style={{}}) — ✅ Migrado na branch `fix/css-inline`

> Todos os ~45 `style={{}}` mapeados abaixo foram convertidos para classes CSS nos arquivos `.css` de cada módulo. Apenas os marcados como "Manter" foram preservados (dinâmicos em runtime).



### `src/app/(auth)/login/page.tsx`

| Linha | Trecho | Classe sugerida |
|---|---|---|
| 173 | `style={{ marginTop: '20px' }}` | `.auth-footer-link--top` |
| 177 | `style={{ marginTop: '8px' }}` | `.auth-footer-link--sub` |
| 182 | `style={{ textAlign: 'center', marginTop: '12px' }}` | `.install-btn-wrap` |
| 189–205 | Bloco completo de instruções iOS (8 propriedades) | `.ios-install-hint` |
| 201 | `style={{ color: 'rgba(180,140,60,0.9)' }}` (×2 `<strong>`) | `.ios-install-hint strong` via CSS |

### `src/app/(auth)/cadastro/page.tsx`

| Linha | Trecho | Classe sugerida |
|---|---|---|
| 102–115 | Bloco de confirmação de e-mail (8 propriedades) | `.auth-confirm-email` |
| 166 | `style={{ marginTop: '20px' }}` | `.auth-footer-link--top` |

### `src/app/(dashboard)/closet/page.tsx`

| Linha | Trecho | Classe sugerida |
|---|---|---|
| 588 | `style={{ position: 'relative' }}` | `.closet-cols-wrap` |
| 639–648 | Banner de upgrade — container (6 props) | `.closet-upgrade-banner` |
| 640–643 | Info do banner (4 props) | `.closet-upgrade-banner-info` |
| 644–647 | Ações do banner (3 props) | `.closet-upgrade-banner-actions` |
| 645 | Botão fechar (6 props inline) | `.closet-upgrade-banner-close` |
| 646 | Link upgrade (8 props inline) | `.closet-upgrade-btn` |
| 654 | `style={cols > 1 ? { gridTemplateColumns: ... } : undefined}` | Manter — dinâmico e correto |
| 657 | `style={{ gridColumn: '1/-1', padding... }}` (loading) | `.closet-grid-placeholder` |
| 661 | `style={{ gridColumn: '1/-1', padding... }}` (empty) | `.closet-grid-placeholder` |
| 719 | `style={{ height: '120px' }}` no upload-area | `.upload-area--small` |
| 743–744 | Label "Trocar foto" + div modal-btn (3 props) | `.modal-swap-photo` |
| 747 | `style={{ display: 'none' }}` (input file) | Manter — padrão para inputs ocultos |
| 766–768 | Botão excluir (3 props de cor vermelha) | `.modal-btn--danger` |
| 786 | `style={{ display: 'block', cursor: 'pointer' }}` | `.upload-label` |
| 791 | `style={{ display: 'none' }}` | Manter |
| 996 | Botão "Voltar" no onboarding (4 props) | `.onboarding-btn--ghost` |

### `src/app/(dashboard)/lookbook/page.tsx`

| Linha | Trecho | Classe sugerida |
|---|---|---|
| 303 | `style={{ display: 'flex', gap: '4px' }}` | `.lookbook-card-tags` |
| 340–342 | `style={{ gridTemplateColumns: ... }}` (dinâmico por quantidade) | Manter — dinâmico |
| 347 | `style={... ? { gridColumnStart: '3' } : undefined}` | Manter — dinâmico |
| 352 | Placeholder vazio de peça (4 props) | `.lookbook-piece-placeholder` |
| 375 | Placeholder menor (4 props) | `.lookbook-piece-placeholder--sm` |
| 464 | `style={{ display: 'none' }}` (input file try-on) | Manter |
| 484–490 | Hint "Selecione uma peça" (4 props) | `.tryon-select-hint` |

### `src/app/(dashboard)/mia/page.tsx`

| Linha | Trecho | Classe sugerida |
|---|---|---|
| 290 | `style={{ width: '100%', height: '100%', objectFit: 'cover' }}` | `.mia-anchor-img` |
| 292 | `style={{ fontSize: 18, opacity: 0.3 }}` | `.mia-anchor-placeholder` |
| 387–388 | `style={{ marginTop: ... }}` nos cards de wishlist | `.mia-wishlist-card` + `:first-child` |
| 388–389 | `style={{ padding: '10px' }}` | `.mia-wishlist-body` |
| 389–395 | Badge de prioridade (5 props) | `.mia-wishlist-priority` |
| 401–407 | Motivo da wishlist (4 props) | `.mia-wishlist-reason` |

### `src/app/(dashboard)/perfil/page.tsx`

| Linha | Trecho | Classe sugerida |
|---|---|---|
| 193 | Loading state (3 props) | `.perfil-loading` |
| 250–252 | `display: flex` em 4 field-rows idênticos | `.field-row-value-wrap` |
| 287 | `style={{ fontSize: "11px" }}` no estilo | `.field-row-value--small` |
| 313–314 | Botão "Gerenciar assinatura" (3 props de cor verde) | `.upgrade-btn--active` |
| 351–358 | Container de links do rodapé (6 props) | `.perfil-footer-links` |
| 360–363 | 4× `<a>` com `style={{ fontSize, color, textDecoration }}` | `.perfil-footer-link` via CSS |

---

## 3. Oportunidades de Melhoria

### Componentes a extrair
- **`ModalSheet`** — o padrão `.modal-overlay > .modal-sheet > .modal-handle` aparece 4× no closet, 2× no lookbook e 1× no perfil. Um componente `<ModalSheet open={} onClose={}>` eliminaria ~300 linhas de markup duplicado.
- **`WishlistCard`** — o card de wishlist existe em duas variantes (sugestão + salva) no closet e na Mia. Merece um componente compartilhado.
- **`UploadLabel`** — o padrão `<label><div className="upload-area"/><input type="file" style="display:none"/></label>` ocorre 5× no closet e 1× na nova peça.
- **`compressForAnalysis`** — idêntica em `closet/page.tsx` (como `compressImage`) e `nova-peca/page.tsx`. Deve ser extraída para `lib/image.ts`.

### Estados que poderiam ser simplificados
- `closet/page.tsx` tem 30+ estados no mesmo componente. O bloco de wishlist (7 estados) e o bloco de onboarding (9 estados) deveriam ser sub-componentes com estados próprios.
- `aiSuggestion: any` em `closet/page.tsx:137` deveria ser tipado com a interface retornada por `/api/pieces/analyze`.

### Loading states faltando
- `handleGenerateStudio` em `nova-peca/page.tsx`: se `getUser()` falhar no early return (`if (!user || !photos[0]) return`), `setStudioLoading(false)` nunca é chamado — botão fica desabilitado para sempre.
- `handleTryOn` no lookbook: polling não tem feedback de progresso além do spinner — mostrar "X de 30 tentativas" ajudaria.
- `handleUpgrade` e `handleManageSubscription` no perfil: sem estado de loading no botão — double-click pode disparar duas chamadas.

### Acessibilidade
- Botões ícone sem `aria-label`: `✦` (sugerir), `♡` (wishlist), `✕` (fechar modais), `→` (enviar mensagem), `+` (FAB), `×` (remover âncora).
- Cards do closet são `<div onClick>` — deveriam ser `<button>` ou ter `role="button"` + `tabIndex={0}` + `onKeyDown`.
- Imagens de peças têm `alt={piece.name}` ✅, mas avatares e fotos de estúdio têm `alt="avatar"` / `alt="Preview"` genérico.
- `<input type="file">` ocultos dentro de `<label>` sem `id`/`htmlFor` — funcionam visualmente mas leitores de tela podem não associar corretamente.

### Performance
- Todas as `<img>` usam a tag nativa em vez do `<Image>` do Next.js — sem lazy loading automático, sem otimização de formato (WebP/AVIF), sem blur placeholder.
- `URL.createObjectURL` em renders de lista (`photos.map(photo => URL.createObjectURL(photo))`) cria novos object URLs a cada render. Deveriam ser memoizados ou convertidos para estado.
- O `MutationObserver` no `BottomNav` observa mutações no `<html>` — correto para detectar troca de tema, mas sem `subtree: false` explícito pode ser mais custoso que o necessário.

---

## 4. Dívida Técnica

### ~~`console.log` de diagnóstico em produção~~ ✅ Corrigido

| Arquivo | Situação |
|---|---|
| `api/pieces/studio/route.ts` | 6 logs de diagnóstico removidos |
| `api/tryon/route.ts` | `console.log('[tryon] API Key prefix:', ...)` removido |

### ~~Tipos fracos (`any`)~~ ✅ Corrigido em `fix/code-cleanup`

| Arquivo | Variável | Solução |
|---|---|---|
| `closet/page.tsx` | `aiSuggestion: any` | Interface `AiSuggestion` com todos os campos retornados por `/api/pieces/analyze` |
| `perfil/page.tsx` | `updateData: any` | Interface `ProfileUpdate` com campos opcionais tipados |
| `api/mia/chat/route.ts` | `history: any`, `weather: any`, `anchorPiece: any` | Interfaces `ChatMessage`, `WeatherData`, `AnchorPiece` |
| `api/mia/chat/route.ts` | casts inline em `reduce` e `map` | Removidos — inferência suficiente |
| `api/stripe/webhook/route.ts` | `(invoice as any).subscription` | `(invoice as unknown as { subscription: string }).subscription` |
| `api/stripe/webhook/route.ts` | `event.data.object as any` | `Stripe.Subscription \| Stripe.Invoice` |

### Código morto / não utilizado
- Constante `LIMITS` em `src/lib/rate-limit.ts` (linhas 3–16) — definida mas nunca lida na lógica de `checkRateLimit`. A função sempre bloqueia usuários free após o trial expirar, independente dos limites definidos.
- `/app/(dashboard)/outfit-ia/page.tsx` — só faz `router.replace('/mia')`. Poderia ser um redirect de servidor em `next.config.js` (eliminaria o carregamento do client bundle).

### Gambiarras conhecidas
- `window.location.reload()` no `handleAvatarSave` (`perfil/page.tsx:180`) para forçar cache-bust da imagem de avatar — documentado como intencional no CONTEXT.md.
- `try {} catch {}` silencioso em `closet/page.tsx:188` ao ler `anchor_piece` do sessionStorage — aceitável, mas sem feedback de erro.
- Polling com `setTimeout` recursivo no Try-On (`lookbook/page.tsx:175`) — funciona mas acumula closures; preferível usar `setInterval` com `clearInterval`.
- `middleware.ts` ainda nomeado como tal — está deprecado no Next.js 16 (deve ser `proxy.ts`), gera aviso a cada build.

### TODOs implícitos sem data
- Rate limiting na rota `/api/mia/extract-date` — reconhecido no CONTEXT.md como pendente.
- Histórico de outfits usados (`outfit_history`) — tabela existe no banco, sem UI.
- Visão computacional desativada no `outfit/generate` — comentado como "feature futura Pro".

---

## 5. Segurança

### ✅ SSRF em `/api/pieces/studio` — Corrigido
`photo_url` agora é validada contra o hostname do `NEXT_PUBLIC_SUPABASE_URL` antes do `fetch()`. URLs de outros domínios retornam 400.

### ✅ Sem rate limiting em `/api/pieces/studio` — Corrigido
Rate limiting adicionado via `checkRateLimit(user.id, 'studio_generate')`. Limites: 10/mês no plano free, 999/mês no plano pro. Coluna `usage_studio_generations` adicionada ao reset mensal. **Requer migration:** `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_studio_generations INTEGER DEFAULT 0;`

### 🟡 Sem rate limiting em `/api/mia/extract-date`
Rota chama a Anthropic API sem proteção. Baixo risco de abuso isolado, mas em conjunto com spam de mensagens pode amplificar o custo da rota principal. **Solução:** reutilizar o `checkRateLimit` de `mia_chat` ou adicionar um limite próprio.

### 🟡 `/api/tryon/status` não valida ownership
Qualquer usuário autenticado pode consultar o status de qualquer `predictionId` fornecendo o parâmetro `?id=`:

```typescript
// tryon/status/route.ts
const predictionId = searchParams.get('id')
// nenhuma verificação de que predictionId pertence ao user atual
```

Risco prático baixo (IDs são opacos e gerados pela FASHN), mas é uma falha de autorização. **Solução:** armazenar o `predictionId` com `user_id` em cache temporário (ex: Supabase ou Edge Config) e validar o owner antes de retornar o status.

### 🟡 Validação de input ausente em rotas de IA
Nenhuma das rotas (`mia/chat`, `pieces/analyze`, `outfit/generate`, `wishlist/generate`) valida o tamanho ou tipo dos campos recebidos no body. Um payload muito grande (ex: `history` com 10.000 mensagens) pode causar timeout ou custo elevado de tokens. **Solução:** limitar `history` a últimas N mensagens (já feito no `extract-date` com `.slice(-4)`, mas não no `mia/chat`) e adicionar validação de comprimento máximo.

### 🟢 Pontos corretos
- Webhook Stripe valida assinatura HMAC antes de processar qualquer evento ✅
- `SUPABASE_SERVICE_ROLE_KEY` usada apenas no webhook (server-side only) ✅
- RLS ativo em todas as tabelas — queries sem `user_id` retornam vazio ✅
- Storage público mas paths baseados em `user_id` (`pieces/{user.id}/...`) ✅
- Nenhuma chave de API exposta no client bundle ✅
- Autenticação verificada no início de todas as rotas de API ✅

---

## Resumo Executivo

| Categoria | Achados críticos | Achados médios | Achados baixos |
|---|---|---|---|
| Funcionalidades | 0 | 3 (studio sem merge, try-on trial, looking) | 4 |
| CSS inline | — | 0 | ~45 ocorrências |
| Melhorias | — | 4 (extrair componentes, perf imagens) | 8 |
| Dívida técnica | 0 | 2 (console.log prod, código morto) | 6 |
| Segurança | ~~2~~ 0 (SSRF e rate limit corrigidos) | 2 (tryon status, extract-date) | 3 |

**Prioridade imediata:**
1. ✅ Validar `photo_url` antes do `fetch()` na rota de estúdio (SSRF) — corrigido em `fix/security-audit`
2. ✅ Adicionar rate limiting à rota `/api/pieces/studio` — corrigido em `fix/security-audit`
3. ✅ Remover os 6 `console.log` de diagnóstico da rota de estúdio + log da chave FASHN no tryon — corrigido em `fix/security-audit`
4. ✅ Mergear a branch `feat/studio-cost-optimization` em `main` — já estava integrado
5. Expor o Virtual Try-On para usuários em trial ativo
