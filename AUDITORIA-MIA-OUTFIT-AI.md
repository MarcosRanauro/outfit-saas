# Auditoria Técnica — Mia Outfit AI (outfit-saas)

**Data:** 12 de junho de 2026
**Repositório auditado:** `github.com/MarcosRanauro/outfit-saas` (branch `main`, clone raso)
**Escopo:** código-fonte real (`src/`), configuração, migrations SQL versionadas, documentação
**Método:** leitura arquivo a arquivo + varreduras automatizadas (auth, RLS, SSRF, tipos, inline styles, segredos)
**Padrão de referência:** o que uma empresa de software madura exigiria antes de chamar isto de "produção séria"

> Nota de transparência: esta auditoria foi feita pelo **Claude Opus 4.8**, não pelo Fable 5. O Fable 5 é um modelo separado que precisa ser selecionado manualmente no seletor de modelos — eu não consigo trocar para ele sozinho.

---

## Resumo geral

**Estado: SAUDÁVEL, com ajustes pontuais.**

Este não é um projeto amador disfarçado de SaaS. É um produto real, com fundamentos de segurança acima da média para um projeto solo: autenticação consistente, isolamento por RLS, proteção anti-SSRF, validação de webhook Stripe, rate limiting por plano e zero uso de `any` no código TypeScript. A camada de billing está correta. A maioria dos riscos óbvios já foi fechada — inclusive, o repositório já tem um `AUDIT.md` interno (Sonnet 4.6, 22/05) e várias correções aplicadas desde então.

O que separa o estado atual de um "padrão empresa renomada" **não é segurança crítica** — é **maturidade de engenharia**: ausência total de testes automatizados, ausência de CI/CD, schema do banco fora do controle de versão, observabilidade inexistente (só `console.error`), e documentação que se contradiz entre arquivos. Nenhum desses é um incêndio. Todos são o tipo de coisa que, quando você tiver 500 usuários pagantes, vira a diferença entre dormir tranquilo e debugar produção às 2h da manhã sem nenhum rastro.

**Veredito por área:**

| Área | Nota | Comentário |
|---|---|---|
| Segurança (auth/authz) | 9/10 | Sólida. RLS + getUser em todas as rotas privadas. |
| Backend/API | 8/10 | Padrões consistentes; faltam validação de schema e 1 rate-limit. |
| Qualidade de código | 8/10 | Tipagem forte, sem `any`. Arquivos grandes e parsing frágil de IA. |
| Frontend/UX | 8/10 | Estados completos; componentes gigantes precisam quebrar. |
| CSS/UI | 7/10 | Tokens bem usados, mas 3 sistemas de variáveis coexistem. |
| Banco de dados | 6/10 | RLS correto, mas schema não versionado é a maior dívida. |
| DevOps/maturidade | 4/10 | Sem testes, sem CI, sem observabilidade. Aqui mora o gap. |
| Documentação | 6/10 | Rica, porém contraditória entre si. |

---

## Pontos positivos (o que está bem feito)

1. **Autenticação consistente e correta.** Das 15 rotas de API, 13 chamam `supabase.auth.getUser()` antes de qualquer operação. As 2 exceções são legítimas: `weather` (proxy público do Open-Meteo, sem segredos) e `stripe/webhook` (autentica via assinatura HMAC, que é o padrão correto).

2. **Service role key isolada.** A `SUPABASE_SERVICE_ROLE_KEY` aparece em **um único arquivo** — o webhook do Stripe — exatamente onde precisa bypassar RLS. Em nenhum Client Component, em nenhuma outra rota.

3. **Proteção anti-SSRF real.** `studio`, `ghost-mannequin` e `describe` validam o hostname de qualquer URL de imagem contra `NEXT_PUBLIC_SUPABASE_URL` antes do `fetch()`. Isso impede que um usuário mande o servidor buscar `http://169.254.169.254/` (metadados de cloud) ou uma URL interna.

4. **Webhook Stripe blindado.** Valida `constructEvent` (HMAC) antes de processar, usa service role para escrever, trata `payment_succeeded`, `subscription.deleted` e `payment_failed`. Checkout e portal autenticam e checam ownership.

5. **Ownership validado no Try-On.** A rota `tryon/status` não confia no `predictionId` do cliente — ela cruza contra a tabela `tryon_predictions` filtrando por `user_id`. Sem isso, qualquer usuário poderia ler o resultado de try-on de outro. Bem pensado.

6. **Zero `any`.** Varredura completa: nenhuma ocorrência de `: any`, `as any` ou `<any>`. Para um projeto deste tamanho (10k linhas TS), isso é raro e mostra disciplina.

7. **`dangerouslySetInnerHTML` usado com segurança.** As 3 ocorrências são todas o script de inicialização de tema (`localStorage` → classe no `<html>`). Nenhuma injeta dado de usuário. Sem vetor de XSS.

8. **Rate limiting por plano com colunas separadas.** Cada ação de IA (`mia_chat`, `outfit_generate`, etc.) tem coluna própria de contador. O bug histórico de contadores compartilhados foi resolvido.

9. **Documentação de processo acima da média.** `CLAUDE.md`, `CONTEXT.md`, `DECISOES.md`, `SECURITY.md`, `.env.example` comentado, `AUDIT.md`. A maioria dos projetos solo não tem nada disso.

---

## Problemas críticos

Nenhum problema **crítico** ativo (do tipo "vaza dado entre contas" ou "qualquer um cobra no seu Stripe"). Os dois abaixo são o teto de severidade atual — sérios, mas contidos.

### CRÍTICO-1 — Schema do banco e RLS não estão versionados

- **Arquivo:** `supabase/migrations/` (só contém `0001_tryon_predictions.sql` e `0002_piece_photos.sql`)
- **Problema:** As tabelas centrais — `profiles`, `pieces`, `outfits`, `outfit_history`, `wishlist_items` — e **todas as suas RLS policies**, mais a função RPC `increment_usage`, foram aplicadas manualmente no SQL Editor do Supabase. Não existem no repositório.
- **Impacto:** (1) A segurança real do app depende de RLS que **não pode ser auditada nem revisada em PR** — está só no painel do Supabase. (2) Se o projeto Supabase for perdido, corrompido ou você precisar recriar em staging, **não há como reproduzir o schema**. (3) Mudanças de policy não têm histórico nem rollback. Para um produto que cobra dinheiro, isto é a maior fragilidade estrutural.
- **Solução:** Rodar `supabase db pull` (ou `pg_dump --schema-only`) e commitar o schema completo + todas as policies como migration `0000_initial_schema.sql`. A partir daí, **toda** mudança de schema vira migration versionada. Isto também resolve a impossibilidade atual de verificar se `increment_usage` é `SECURITY DEFINER` com validação adequada (ver IMPORTANTE-1).
- **Prioridade:** Máxima. É a primeira coisa a fazer.

### CRÍTICO-2 — Não há nenhum teste automatizado nem CI

- **Arquivo:** ausência de `*.test.ts`, ausência de `.github/workflows/`, sem script `test` no `package.json`
- **Problema:** Zero cobertura de testes. Zero verificação automática em push. O único portão de qualidade é `npm run build` rodado manualmente.
- **Impacto:** As partes mais perigosas do app — cálculo de rate limit, lógica de trial/expiração, parsing da saída da IA, transições de plano no webhook — não têm rede de proteção. Uma refatoração inocente pode liberar acesso ilimitado de graça, ou cobrar um trial ativo, sem ninguém perceber até um usuário reclamar. Numa empresa séria, billing e autorização **sempre** têm teste.
- **Solução:** (1) Adicionar Vitest. (2) Escrever testes unitários para `rate-limit.ts` (trial ativo → ilimitado; trial expirado + free → bloqueado; reset de 30 dias; limite atingido) e `plan-limits.ts`. (3) Um GitHub Action mínimo: `lint` + `build` + `test` em cada PR. Isso sozinho já te coloca à frente da maioria dos SaaS pequenos.
- **Prioridade:** Alta.

---

## Problemas importantes

### IMPORTANTE-1 — `increment_usage` é uma RPC que recebe `user_id` por parâmetro

- **Arquivo:** `src/lib/rate-limit.ts` → `supabase.rpc('increment_usage', { user_id, column_name })`
- **Problema:** A função recebe `user_id` e `column_name` do código. Como o schema não está versionado, **não consigo confirmar** se ela é `SECURITY DEFINER` (bypassa RLS) e se valida que `user_id = auth.uid()`. Se for `SECURITY DEFINER` sem essa checagem, um usuário autenticado poderia, via chamada direta à RPC, incrementar/manipular contador de outro — e pior, `column_name` dinâmico em SQL é superfície de injeção se concatenado.
- **Impacto:** Potencialmente médio-alto (manipulação de uso de terceiros). Não confirmado por falta do schema — exatamente por isso o CRÍTICO-1 importa.
- **Solução:** Versionar a função. Garantir que ela use `auth.uid()` internamente em vez de confiar no `user_id` recebido, ou valide `user_id = auth.uid()`. Usar `format(%I)` / lista branca de colunas para `column_name`, nunca concatenação crua.
- **Prioridade:** Alta (verificar imediatamente após versionar o schema).

### IMPORTANTE-2 — Rota `pieces/describe` chama a Anthropic sem rate limit

- **Arquivo:** `src/app/api/pieces/describe/route.ts`
- **Problema:** Tem auth (`getUser`) e validação de host (SSRF), mas **não** chama `checkRateLimit`. Envia até 3 fotos para `claude-sonnet-4-6` por requisição. É a única rota que toca a Anthropic sem proteção de uso.
- **Impacto:** Um usuário no plano free (ou em trial) pode chamar essa rota em loop e gerar custo direto de API ilimitado para você. Vetor de abuso de custo.
- **Solução:** Adicionar `checkRateLimit(user.id, 'pieces_analyze')` no topo (reutilizar o contador de análise faz sentido, já que `describe` é parte do mesmo fluxo) + `incrementUsage` no sucesso.
- **Prioridade:** Alta — é a única lacuna de custo aberta.

### IMPORTANTE-3 — Saída da IA é consumida com `JSON.parse` sem validação de schema

- **Arquivos:** `outfit/generate`, `wishlist/generate`, `pieces/analyze`, `mia/extract-date`
- **Problema:** Todas fazem `JSON.parse(clean)` na resposta do modelo e usam o resultado direto. Em `outfit/generate`, faz-se `outfit.piece_ids.includes(p.id)` — mas não há validação de que `parsed.outfits` existe, é array, ou que cada item tem `piece_ids`. Se o modelo devolver algo fora do formato (acontece), o `.map` quebra e cai no `catch` genérico ("Erro ao processar resposta") — o usuário perde a geração inteira.
- **Impacto:** Robustez. Falhas intermitentes e opacas que viram ticket de suporte e frustração. Não é segurança (os IDs são filtrados contra peças reais do próprio usuário, então não há vazamento), é confiabilidade.
- **Solução:** Validar a forma do JSON antes de usar (Zod é o caminho — ver IMPORTANTE-4). No mínimo: checar `Array.isArray(parsed.outfits)` e filtrar itens malformados em vez de deixar o `.map` explodir. Considerar `tool_use`/structured output da Anthropic para forçar o schema na origem.
- **Prioridade:** Média-alta.

### IMPORTANTE-4 — Nenhuma validação de schema nos bodies de request

- **Arquivos:** todas as rotas de API
- **Problema:** Os bodies são desestruturados direto do `request.json()` sem validação (`const { period, occasion, temp } = body`). Tipos numéricos como `temp` entram crus no prompt. Não há lib de validação (Zod/Valibot ausentes).
- **Impacto:** Inputs malformados chegam fundo na lógica antes de falhar, com mensagens ruins. Não é crítico porque a RLS protege os dados, mas é abaixo do padrão profissional de "valide na fronteira".
- **Solução:** Adotar Zod. Definir um schema por rota, validar logo após `getUser`. Bônus: os tipos saem de graça do schema.
- **Prioridade:** Média.

### IMPORTANTE-5 — `moderateImage` falha "aberto" (fail-open)

- **Arquivos:** `src/lib/image.ts` e `src/app/api/pieces/moderate/route.ts`
- **Problema:** Se a API de moderação da OpenAI falhar ou der timeout, ambas as camadas retornam "não sinalizado" (upload permitido). O comentário no código é explícito: "Moderation API error — permitindo upload".
- **Impacto:** Numa indisponibilidade da OpenAI, todo o pipeline de moderação de conteúdo fica desligado silenciosamente — conteúdo impróprio pode entrar. Para um app com fotos enviadas por usuários, isso é um risco de conteúdo/reputação real.
- **Solução:** Decisão de produto. O mais seguro é **fail-closed** (bloquear upload e pedir para tentar de novo) quando a moderação não responde. No mínimo, logar/alertar quando o fail-open dispara, para você saber que está cego. Hoje é só um `console.warn` que ninguém vê.
- **Prioridade:** Média.

### IMPORTANTE-6 — Componentes gigantes (page.tsx de 600–750 linhas)

- **Arquivos:** `closet/page.tsx` (757), `perfil/page.tsx` (667), `closet/[id]/page.tsx` (659), `nova-peca/page.tsx` (632), `mia/page.tsx` (544)
- **Problema:** São componentes-monolito que misturam fetch de dados, estado, lógica de negócio, modais, filtros e render. `closet/page.tsx` ainda calcula `uniqueValues()` percorrendo todas as peças a cada render, **sem `useMemo`** (zero ocorrências no arquivo).
- **Impacto:** Manutenção e performance. Em closets grandes, o recálculo a cada render gera lentidão perceptível. Arquivos desse tamanho são difíceis de revisar e fáceis de quebrar.
- **Solução:** Extrair hooks (`useCloset`, `usePieceForm`) e subcomponentes (modais, drawers já estão parcialmente extraídos — bom). Memoizar `uniqueValues` e `filteredPieces` com `useMemo`.
- **Prioridade:** Média (manutenção), com o `useMemo` sendo um quick win imediato.

### IMPORTANTE-7 — Documentação se contradiz entre arquivos

- **Arquivos:** `CLAUDE.md`, `PROJETO.md`, `README.md`
- **Problemas concretos:**
  - **Preço do Pro:** `CLAUDE.md` diz **R$ 19/mês**; `PROJETO.md` e `README.md` dizem **R$ 29/mês**. Qual é o verdadeiro? Isso precisa bater com o Stripe.
  - **Versão do Next:** `README.md` e `PROJETO.md` dizem "Next.js 15"; o real (`package.json`) é **16.2.6**.
  - **Fases:** `PROJETO.md` ainda marca Fases 5/6/7 como `[ ]` não concluídas, quando estão em produção.
  - **`.env` no README:** documenta só 3 variáveis; o app real precisa de ~13 (o `.env.example` está correto e completo, mas o README não).
- **Impacto:** Confusão para qualquer pessoa (ou IA) que entre no projeto. Um preço errado na doc pode virar preço errado na landing.
- **Solução:** Eleger uma fonte de verdade (sugiro `CLAUDE.md` + `.env.example`), corrigir os números, e aposentar/alinhar `PROJETO.md` (que está fossilizado).
- **Prioridade:** Média.

---

## Melhorias recomendadas (não urgentes)

- **Security headers ausentes.** `next.config.ts` não define `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`. Adicionar via `headers()` no `next.config.ts` é baixo esforço e fecha clickjacking/MIME-sniffing. Empresa renomada faz isso por padrão.
- **Observabilidade.** Há 46 `console.error/warn` e nada além disso. Em produção na Vercel, isso some no vazio. Plugar Sentry (ou similar) para erros de servidor e dos webhooks daria visibilidade real. Hoje, se o webhook do Stripe falhar, você só descobre quando o usuário reclamar que pagou e continua free.
- **`outfit-ia/page.tsx` é um redirect client-side morto.** Funciona, mas um `redirect()` server-side (ou `redirects` no `next.config`) é mais limpo e evita o flash de tela em branco.
- **Erro 500 com `err.message` exposto.** `describe`, `moderate` e `studio` retornam `err.message` cru no JSON de erro, e `tryon` retorna `detail: data` da FASHN. Pode vazar detalhe interno. Trocar por mensagem genérica ao cliente + log detalhado no servidor.
- **`uniqueValues`/`filteredPieces` sem memoização** (já citado) — `useMemo` resolve.
- **Paginação no closet.** Hoje carrega todas as peças de uma vez. Acima de algumas centenas, paginar/virtualizar.
- **Bug cosmético do reset de 30 dias** (documentado no CONTEXT): no dia exato do reset, a primeira chamada ainda lê o contador antigo. Baixo impacto, mas o teste do CRÍTICO-2 pegaria isso.

---

## Auditoria de CSS e UI

**Estado: bom, com fragmentação de tokens.**

- **Pontos fortes:** Uso real de design tokens via CSS custom properties — `--ec-accent` (112 usos), `--ec-border`, `--ec-text-*` etc. estão consistentemente espalhados. Isso é profissional e raro em projeto solo.
- **Problema principal — três sistemas de variáveis coexistem:** `--ec-*` (Édition Claire), `--dash-*` (dashboard) e `--lp-*` (landing page). Há sobreposição conceitual (`--ec-accent` vs `--lp-gold` são "o dourado da marca" em dois lugares). Consolidar num único conjunto de tokens de marca (`--mia-gold`, `--mia-bg`...) e derivar os contextuais dele reduziria inconsistência e bugs de tema.
- **Inline styles:** 27 ocorrências em `termos/page.tsx` e 27 em `privacidade/page.tsx`. São páginas de texto legal — baixo risco, mas é o tipo de coisa que se extrai para uma classe `.legal-prose` e pronto. Os demais arquivos têm contagens baixas e justificáveis (valores dinâmicos como `gridTemplateColumns`, `backgroundImage` de tema).
- **CSS volumoso:** `landing.css` (2091 linhas) e `closet.css` (1767) são grandes. Não é erro, mas dificulta achar coisas. Quebrar por seção ajudaria.
- **Toggle de tema:** o padrão de script inline + `suppressHydrationWarning` para evitar flash está corretíssimo. Boa engenharia.

**Ordem sugerida:** (1) unificar tokens de marca; (2) extrair prose legal; (3) modularizar os 2 CSS gigantes.

---

## Auditoria de segurança (consolidada)

| Vetor | Estado | Nota |
|---|---|---|
| Segredos commitados | ✅ Limpo | Nenhum `.env` no repo; `.gitignore` correto |
| Service role key | ✅ Isolada | Só no webhook Stripe |
| Auth em rotas privadas | ✅ 13/13 | As 2 sem auth são públicas legítimas |
| Autorização entre usuários | ✅ RLS + ownership | Try-on valida ownership; RLS em todas as tabelas |
| SSRF | ✅ Protegido | Host allowlist em studio/ghost/describe |
| XSS | ✅ Sem vetor | `dangerouslySetInnerHTML` só em script de tema controlado |
| Webhook Stripe | ✅ HMAC validado | `constructEvent` antes de processar |
| Validação de input | ⚠️ Manual | Sem Zod; bodies crus (IMPORTANTE-4) |
| Rate limit (custo IA) | ⚠️ 1 lacuna | `describe` sem proteção (IMPORTANTE-2) |
| Moderação de conteúdo | ⚠️ Fail-open | Bloqueio cai em silêncio se OpenAI falhar (IMPORTANTE-5) |
| RPC `increment_usage` | ❓ Não verificável | Schema fora do versionamento (IMPORTANTE-1) |
| Security headers | ⚠️ Ausentes | CSP/HSTS/X-Frame não configurados |
| Exposição de erro | ⚠️ Parcial | `err.message`/`detail` cru em algumas 500 |

**Conclusão de segurança:** os fundamentos estão certos. As pendências são de *custo* (`describe`), *robustez* (validação) e *auditabilidade* (schema versionado) — não de vazamento de dados.

---

## Auditoria de documentação

| Documento | Estado | Ação |
|---|---|---|
| `README.md` | Desatualizado | Corrigir Next 15→16, preço, lista de `.env` |
| `PROJETO.md` | Fossilizado | Alinhar ou aposentar (contradiz CONTEXT) |
| `CLAUDE.md` | Bom, mas preço diverge | Confirmar R$ do Pro vs Stripe |
| `CONTEXT.md` | Rico e atual | Manter; contém notas já obsoletas (extract-date "sem rate limit" já foi resolvido) |
| `DECISOES.md` | Presente | OK |
| `SECURITY.md` | Bom | Atualizar: afirma fail-closed implícito, mas moderação é fail-open |
| `.env.example` | Completo e comentado | Modelo a seguir |
| Docs de API | Ausente | Considerar um `API.md` com contrato de cada rota |
| Schema SQL | **Ausente do repo** | Versionar (CRÍTICO-1) |

Uma contradição a destacar: o `SECURITY.md` dá a entender que o pipeline de moderação protege os uploads, mas o código é fail-open. Documentação de segurança que não bate com o comportamento real é pior que não ter — alinhar.

---

## Plano de correção recomendado (em etapas)

**Etapa 1 — Auditabilidade e custo (fazer primeiro)**
1. `supabase db pull` → commitar schema completo + RLS + função `increment_usage` como `0000_initial_schema.sql` (CRÍTICO-1).
2. Verificar/corrigir `increment_usage`: usar `auth.uid()`, lista branca de colunas (IMPORTANTE-1).
3. Adicionar `checkRateLimit` + `incrementUsage` em `pieces/describe` (IMPORTANTE-2).

**Etapa 2 — Rede de proteção**
4. Vitest + testes de `rate-limit.ts` e `plan-limits.ts` (trial, reset, limites, transições de plano).
5. GitHub Action: lint + build + test em cada PR (CRÍTICO-2).

**Etapa 3 — Robustez**
6. Zod nos bodies das rotas (IMPORTANTE-4) e na saída da IA (IMPORTANTE-3).
7. Decidir fail-closed vs fail-open na moderação + alertar quando disparar (IMPORTANTE-5).
8. Security headers no `next.config.ts`; sanitizar mensagens de erro 500.

**Etapa 4 — Refatoração**
9. `useMemo` em `closet/page.tsx` (quick win).
10. Quebrar os 5 componentes-monolito em hooks + subcomponentes.

**Etapa 5 — Observabilidade e docs**
11. Plugar Sentry (foco em webhook e rotas de IA).
12. Reconciliar README/PROJETO/CLAUDE (preço, versão, fases); alinhar SECURITY.md com o comportamento real.
13. Unificar tokens de CSS da marca.

---

## O que NÃO mexer agora (sensível, funciona, alto risco de quebrar)

- **Webhook do Stripe** (`stripe/webhook/route.ts`) — está correto e cada alteração mexe com dinheiro real. Só toque com teste.
- **Lógica de trial/expiração em `rate-limit.ts`** — funciona; refatore **só depois** de ter os testes da Etapa 2 cobrindo.
- **Script de inicialização de tema no `layout.tsx`** — o `suppressHydrationWarning` + inline script resolve o flash de tema. Mexer reintroduz o bug.
- **`handleAvatarSave` com `window.location.reload()`** (perfil) — é intencional (cache-bust de imagem), documentado. Não "consertar" para `router.refresh` sem testar o cache.
- **Validação de ownership do Try-On** — está certa; não simplifique.

---

## Próxima ação recomendada

**Comece pelo CRÍTICO-1: versionar o schema.** Rode `supabase db pull` e commite o schema completo com as RLS policies e a função `increment_usage`. Isso (1) torna sua segurança auditável e reproduzível, (2) é pré-requisito para verificar o IMPORTANTE-1, e (3) é a única dívida que, se você perder acesso ao painel do Supabase hoje, te deixa sem como reconstruir o produto. É também o item que mais separa "projeto de uma pessoa" de "produto de empresa".

Depois disso, a sequência natural é: rate-limit no `describe` (fecha a última torneira de custo aberta) → Vitest cobrindo billing/rate-limit (a rede de proteção) → e aí você pode refatorar à vontade sem medo.

---

*Auditoria gerada por Claude Opus 4.8 a partir de leitura direta do código em `github.com/MarcosRanauro/outfit-saas@main`. Findings sobre a RPC `increment_usage` dependem de schema não presente no repositório e devem ser confirmados após o versionamento.*
