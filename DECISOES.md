# Decisões Técnicas — Mia Outfit AI

Registro das principais decisões de arquitetura e tecnologia tomadas durante o desenvolvimento.
Formato baseado em [Architecture Decision Records (ADR)](https://adr.github.io/).

---

## [2026-04-27] — Supabase como banco de dados e storage

**Contexto:** O projeto precisava de banco relacional, autenticação, storage de arquivos e políticas de segurança por linha (RLS) em uma solução única, sem gerenciar infraestrutura.

**Opções consideradas:**
- Firebase (Firestore + Auth + Storage)
- PlanetScale + Auth.js + S3
- Supabase (PostgreSQL + Auth + Storage)

**Decisão:** Supabase com projeto na região São Paulo (`sa-east-1`).

**Motivo:** PostgreSQL é mais adequado para dados relacionais (peças, outfits, perfis) do que Firestore. RLS nativo elimina a necessidade de validar `user_id` manualmente em cada query. Auth embutido com suporte a Google OAuth sem configuração extra. Storage com políticas públicas por bucket cobre o caso de fotos de peças sem signed URLs. Plano gratuito generoso para a fase inicial.

**Consequências:** Toda query server-side usa `createClient()` de `lib/supabase/server.ts` com o cookie da sessão; toda query client-side usa `lib/supabase/client.ts`. A `SUPABASE_SERVICE_ROLE_KEY` é usada apenas no webhook do Stripe (operações fora do contexto de usuário). Migrar de Supabase seria custoso — decisão de longo prazo.

---

## [2026-04-27] — Vercel como plataforma de deploy

**Contexto:** O projeto é um Next.js App Router com Server Components, Server Actions e API Routes. A escolha de hospedagem afeta diretamente DX, cold starts e compatibilidade com o runtime do Next.js.

**Opções consideradas:**
- Netlify (suporte parcial ao App Router na época)
- Railway (mais controle, mais configuração)
- Vercel (plataforma oficial do Next.js)

**Decisão:** Vercel com domínio customizado `miaoutfitai.com.br`.

**Motivo:** Integração nativa com Next.js — zero configuração para API Routes, Server Components e middleware. Preview deployments automáticos em cada PR. Edge Network CDN. `maxDuration` por rota para rotas de IA com tempo de resposta longo (60s). Variáveis de ambiente gerenciadas na dashboard da Vercel sem necessidade de secrets extras.

**Consequências:** Funções serverless com cold start ocasional. Limite de 60s de execução por função — rotas de IA (studio, tryon) declararam `export const maxDuration = 60`. Deploy automático a cada push em `main`.

---

## [2026-05-22] — Remove.bg em vez de gpt-image-1 para foto de estúdio

**Contexto:** A feature "foto de estúdio" foi inicialmente implementada com `gpt-image-1` (geração criativa) mas produzia resultados inconsistentes: o modelo ignorava a categoria da peça, gerava itens completamente diferentes e não mantinha fidelidade ao produto original.

**Opções consideradas:**
1. `gpt-image-1` com prompts mais detalhados (tentado — resultados inconsistentes)
2. Fal.ai BRIA RMBG (testado — boa remoção de fundo, mas requer créditos e latência maior)
3. Photoroom `/v1/segment` (testado — marca d'água no plano gratuito)
4. Remove.bg com `bg_color: ffffff` (escolhido)

**Decisão:** Remove.bg com parâmetros `size: auto`, `bg_color: ffffff`, `format: png`; `sharp` para resize 1024×1024 `fit: contain`.

**Motivo:** Remove.bg aplica fundo branco diretamente na API, elimina a necessidade de `flatten` via `sharp`. Fidelidade 100% ao produto original (não gera nada, apenas remove o fundo). Custo ~$0.013/imagem — comparável ao gpt-image-1 low quality. API simples via multipart/form-data, sem SDK extra. Os blocos anteriores (gpt-image-1, Photoroom, Fal.ai) foram mantidos comentados no código para reversão rápida.

**Consequências:** O resultado não é uma "foto de estúdio gerada por IA" mas sim a foto original com fundo branco — fidelidade máxima ao produto. Requer `REMOVE_BG_API_KEY`. Créditos gratuitos limitados (50/mês no plano gratuito; plano pago por volume).

---

## [2026-04-27] — Anthropic Claude (claude-sonnet-4-6) para Mia e análise de peças

**Contexto:** O produto central é uma assistente de moda com personalidade (Mia). A qualidade das respostas, capacidade de seguir system prompts complexos e entendimento de contexto extenso são críticos.

**Opções consideradas:**
- GPT-4o (OpenAI)
- Gemini Pro (Google)
- Claude Sonnet (Anthropic)

**Decisão:** `claude-sonnet-4-6` fixo em todas as rotas de IA (`mia/chat`, `pieces/analyze`, `outfit/generate`, `wishlist/generate`, `pieces/describe`).

**Motivo:** Claude segue instruções complexas de persona e guardrails com mais consistência que GPT-4o nos testes iniciais. Suporte nativo a blocos de imagem (`ImageBlockParam`) para visão computacional sem configuração extra. Context window de 200k tokens suficiente para closets grandes. Preço competitivo com o GPT-4o para o volume esperado.

**Consequências:** Toda a Mia depende da Anthropic API — queda do serviço bloqueia o chat e a análise. O modelo está fixo no código (`"claude-sonnet-4-6"`) — atualizar requer revisão de todos os `model:` espalhados pelas rotas. `ANTHROPIC_API_KEY` é a chave de maior valor do projeto.

---

## [2026-05-07] — Rate limiting por plano via tabela `profiles`

**Contexto:** Com a Mia chamando APIs pagas (Anthropic, OpenAI, Remove.bg) a cada interação, era necessário limitar o uso por usuário para controlar custos sem depender de serviços externos de rate limiting.

**Opções consideradas:**
- Upstash Redis com sliding window
- Middleware de rate limit externo (ex: Unkey)
- Colunas de contadores na tabela `profiles` com reset mensal

**Decisão:** Colunas `usage_*` na tabela `profiles` (`usage_mia_generations`, `usage_outfit_generations`, `usage_pieces_analyzed`, `usage_wishlist_generations`, `usage_studio_generations`) com reset automático a cada 30 dias via `usage_reset_at`.

**Motivo:** Zero dependência externa. A tabela `profiles` já existe e é lida em todas as rotas autenticadas. Supabase RLS garante que cada usuário só acessa seus próprios contadores. Lógica simples de `checkRateLimit` e `incrementUsage` centralizada em `src/lib/rate-limit.ts`.

**Consequências:** Reset é feito na primeira chamada após 30 dias (lazy reset), não em cron job — comportamento aceitável para o produto. Usuários pro têm limite de 999 (efetivamente ilimitado). Usuários em trial ativo têm acesso ilimitado durante o período. Usuários com trial expirado são bloqueados independente dos contadores. Adicionar nova ação de IA requer migration `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_X INTEGER DEFAULT 0`.

---

## [2026-06-12] — increment_usage usa auth.uid() internamente

**Contexto:** A função RPC `increment_usage` era `SECURITY DEFINER`, recebia `user_id` por parâmetro e usava esse valor no `UPDATE` sem validar contra `auth.uid()`. Com `GRANT` para a role `anon`, um chamador autenticado poderia incrementar o contador de uso de outro usuário (IMPORTANTE-1 da auditoria técnica).

**Opções consideradas:**
1. Remover o parâmetro `user_id` da assinatura e atualizar todas as chamadas em `rate-limit.ts`
2. Manter a assinatura e ignorar `user_id`, usando apenas `auth.uid()` dentro da função
3. Validar `user_id = auth.uid()` em vez de ignorar o parâmetro

**Decisão:** Manter a assinatura `(user_id uuid, column_name text)` por compatibilidade com as chamadas existentes em `src/lib/rate-limit.ts`, mas a função passa a usar **somente** `auth.uid()` no `UPDATE`. Lista branca de colunas permitidas. `SET search_path = public`. `REVOKE ALL` da role `anon`.

**Motivo:** Corrige a vulnerabilidade sem alterar código da aplicação. Migration `0003_secure_increment_usage.sql` documenta a correção no versionamento.

**Consequências:** Chamadas com `user_id` diferente de quem está autenticado não têm efeito — o contador incrementado é sempre o do caller. Após aplicar a migration no banco, regenerar tipos não é necessário (assinatura inalterada). Nova coluna de uso exige atualizar o array `allowed_columns` dentro da função.

---

## [2026-05-01] — Storage público em vez de signed URLs

**Contexto:** Fotos de peças são acessadas frequentemente em listas, cards, modais e enviadas para APIs de IA. Signed URLs têm TTL e precisam ser regeneradas, adicionando latência e complexidade.

**Opções consideradas:**
- Signed URLs com TTL de 1 hora (regenerar no frontend)
- Storage público com paths baseados em `user_id`

**Decisão:** Storage público com paths `pieces/{user_id}/{filename}` e `avatars/{user_id}/avatar.jpg`.

**Motivo:** Fotos de moda não são dados sensíveis — o usuário quer que as fotos apareçam rapidamente em qualquer contexto (closet, lookbook, Mia, estúdio). A "segurança" do path por `user_id` é obscurity, não autenticação real, mas é suficiente para o modelo de produto. Elimina a necessidade de proxies ou refresh de URLs no frontend.

**Consequências:** Qualquer pessoa com a URL direta pode acessar a foto. RLS protege o banco de dados mas não o storage. Aceito como trade-off — o produto não lida com fotos íntimas ou dados médicos.

---

## [2026-05-23] — Moderação de conteúdo com OpenAI Moderation API

**Contexto:** O app aceita upload de fotos de usuários sem validação de conteúdo — risco de armazenamento de imagens impróprias (nudez, conteúdo sexual, violência) no Supabase Storage e envio para Anthropic API e Remove.bg.

**Opções consideradas:**
1. AWS Rekognition (paga, requer SDK extra e configuração IAM)
2. Moderação manual (inviável — produto não tem time de moderação)
3. Terms of Service apenas (sem proteção técnica)
4. OpenAI Moderation API (`omni-moderation-latest`) com suporte a imagens

**Decisão:** OpenAI Moderation API com `omni-moderation-latest` na rota `/api/pieces/moderate`, chamada em base64 antes de qualquer upload ou análise.

**Motivo:** A API de moderação da OpenAI é gratuita para uso em APIs pagas. O modelo `omni-moderation-latest` aceita imagens em base64 (via `data:image/jpeg;base64,...`), sem necessidade de URL pública — compatível com o fluxo antes do upload. A `OPENAI_API_KEY` já estava no projeto (para reverter foto de estúdio com gpt-image-1). Latência estimada ~200ms — aceitável no fluxo de seleção de foto. Em caso de erro da API, a moderação falha-aberta (permite o upload) para não bloquear o usuário por instabilidade externa.

**Consequências:** Toda foto selecionada pelo usuário passa por moderação antes de ser exibida como preview, antes da análise da Mia e antes de qualquer upload. Adiciona ~200ms ao fluxo de seleção. Requer `OPENAI_API_KEY` ativa — sem ela, a moderação falha-aberta silenciosamente. Fotos adicionais ("+") na galeria da Nova Peça não passam por moderação (somente a foto principal passa).
