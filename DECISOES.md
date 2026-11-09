# Decisões Técnicas — Mia Outfit AI

Registro das principais decisões de arquitetura e tecnologia tomadas durante o desenvolvimento.
Formato baseado em [Architecture Decision Records (ADR)](https://adr.github.io/).

---

## [2026-11-09] — Recuperação preventiva de Customer no Stripe Checkout

**Contexto:** Perfis no banco Supabase persistiam o campo `stripe_customer_id`. Quando a aplicação alternava entre chaves de teste (`sk_test_...`) e produção (`sk_live_...`), ou quando um cliente era excluído/recriado no dashboard da Stripe, a criação de uma nova sessão de checkout quebrava com HTTP 500 (`No such customer`). Além disso, valores mascarados por ferramentas de CI/CLI (como `"[SENSITIVE]"`) passavam sem validação até o SDK da Stripe.

**Opções consideradas:**
1. Confiar cegamente no `stripe_customer_id` armazenado no Supabase e esperar que o usuário nunca mude de conta ou ambiente da Stripe.
2. Sempre recriar um novo customer a cada checkout (aumentaria drasticamente a fragmentação de clientes e faturas na Stripe).
3. Verificar a existência do `customerId` com `stripe.customers.retrieve()` e só recriar caso a Stripe retorne 404 (`resource_missing`) ou `deleted: true`.

**Decisão:** Opção 3 implementada em `src/app/api/stripe/checkout/route.ts`.

**Motivo:** Mantém a integridade de clientes existentes na Stripe, mas oferece resiliência total e auto-recuperação contra inconsistências de ambiente local, sandboxes ou trocas de conta sem exigir intervenção manual no banco de dados.

**Consequências:** Uma chamada adicional e rápida a `retrieve()` antes de montar a sessão caso o usuário já possua `stripe_customer_id`, garantindo zero falhas 500 por customer inexistente.

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

## [2026-11-08] — Visualização Arquitetônica de Guarda-Roupas e Arara de Lookbook com Toggles e Isolamento de CSS

**Contexto:** O Closet e o Lookbook eram exibidos exclusivamente como grids tradicionais de cards estáticos. Havia a necessidade de trazer uma experiência visual e tátil inspirada no design nórdico de luxo do protótipo (`prototipo.html`), simulando a arquitetura real de um guarda-roupas organizado e uma arara de boutique suspensa para os looks da Mia, sem romper o fluxo de dados existente do Supabase.

**Opções consideradas:**
1. Substituir integralmente o grid tradicional pelas novas visualizações vetoriais.
2. Criar páginas separadas (ex: `/closet/wardrobe` e `/lookbook/rack`).
3. Manter as rotas originais (`/closet` e `/lookbook`) e introduzir componentes visuais modulares (`InteractiveWardrobe` e `OutfitRack`) alternáveis por toggles de visualização persistidos em `localStorage`.

**Decisão:** Opção 3. Introduzidos `InteractiveWardrobe.tsx` e `OutfitRack.tsx` com toggles `[ 🚪 Armário | ⊞ Grid ]` e `[ 🧥 Arara | ⊞ Cards ]` com `localStorage`. Para evitar colisão com o CSS legado de `closet.css` (onde `.modal-overlay` possuía `opacity: 0` e animações conflitantes), o modal de detalhes do armário adotou a classe isolada `.wardrobe-modal-overlay` com validação de `e.target === e.currentTarget` e `z-index: 1000`.

**Motivo:**
- Preserva a flexibilidade do usuário (quem prefere escanear em grid rápido pode continuar no grid).
- Não altera o schema de dados do Supabase nem a lógica de filtros e busca existentes.
- O isolamento de classe CSS (`wardrobe-modal-overlay`) resolveu definitivamente o problema de fechamento precoce do modal de detalhes, garantindo transições suaves nos temas Édition Claire e Dark Edition.
- `framer-motion` adicionado para gerenciar o balanço e a física suave dos cabides na arara.

**Consequências:**
- Instalação da dependência `framer-motion` no projeto.
- Armazenamento das preferências de exibição do usuário no navegador (`mia-closet-view-mode` e `mia-lookbook-view-mode`).
- A ordem arquitetônica do armário prioriza a experiência de uso diário do vestuário: 1º Cabideiro (blusas/camisas), 2º Gaveteiro (calças/shorts), 3º Sapateira (calçados) e 4º Acessórios/Bolsas por último.

---

## [2026-11-08] — Unificação Estética do Guarda-Roupa (Opção A), Header de Alta Fidelidade e Controle de Overscroll Mobile

**Contexto:** Após a introdução inicial do armário interativo, os compartimentos inferiores (gaveteiro fechado em caixas, sapateira e prateleira de acessórios) apresentavam contraste visual com o cabideiro principal de boutique. Além disso, o header e as barras de contexto divergiam do design editorial detalhado em `prototipo.html`. Em dispositivos móveis (360px a 414px), o layout sofria com quebras de texto, transbordo horizontal e uma tarja preta lateral quando o usuário arrastava da direita para a esquerda, causada pelo fundo `#080808` fixo no `body` sendo exposto durante o *overscroll*.

**Opções consideradas:**
1. Manter gaveteiro com caixas fechadas e apenas redimensionar cards para mobile.
2. Unificar todas as seções sob a estética boutique (Opção A): calceiro com varão de latão e cabides suspensos idênticos ao cabideiro superior, decks/vitrines abertas para calçados com iluminação LED dourada e prateleiras de vidro para acessórios; alinhar o header exatamente ao protótipo; aplicar corte rígido de overflow e controle de encadeamento de rolagem.

**Decisão:** Opção 2.
- O gaveteiro foi transformado no **Calceiro Tátil** com os mesmos trilhos de latão e silhuetas de cabide do cabideiro superior.
- A sapateira e os acessórios adotaram o modelo **Boutique Deck** com prateleira iluminada, silhuetas em destaque e badges funcionais de peça âncora.
- O header de `AppNavbar` e as barras de `.context-bar` e `.filter-chips-bar` foram reescritos em estrita fidelidade visual ao `prototipo.html`.
- Para eliminar a tarja preta e transbordos mobile:
  - `html, body` passaram a ter `background-color: var(--ec-bg-primary)` dinâmico, `overflow-x: clip;` e `overscroll-behavior-x: none;`.
  - Todos os carrosséis de toque adotaram `overscroll-behavior-x: contain;` e `-webkit-overflow-scrolling: touch;`.
  - Todas as ocorrências de `100vw` foram convertidas em `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;`.

**Motivo:**
- Homogeneidade e elegância arquitetônica em todo o móvel, criando coerência sensorial de boutique de luxo.
- Fidelidade absoluta ao design system e tipografia definidos no protótipo.
- Experiência mobile nativa, sem solavancos elásticos, sem corte de texto e sem revelação do fundo escuro em telas claras.

**Consequências:**
- Eliminação definitiva da rolagem horizontal indesejada no documento no Android e iOS.
- Layout 100% responsivo para telas desde 360px (smartphones compactos) até grandes monitores desktop.
- 0 quebras no suite de testes automatizados (71/71 testes passando).

---

# Próximas Decisões Arquiteturais e de Produto a Serem Tomadas (Backlog de Decisões)

> Este capítulo reúne as decisões em aberto, estruturadas com contexto, opções viáveis e trade-offs para direcionar os próximos passos do projeto.

---

## 1. Ativação e Monetização do Provador Virtual (Virtual Try-On FASHN.ai v1.6)

- **Contexto:** A infraestrutura de backend (`/api/tryon` e `/api/tryon/status`) está implementada, mas travada por feature flag (`TRYON_ENABLED = false` em `src/lib/feature-flags.ts`). O modelo `tryon-v1.6` da FASHN.ai gera custo direto por chamada de API.
- **Decisão Necessária:** Como disponibilizar a interface do provador e quais as regras de consumo de créditos entre planos Free (Trial) e Pro.
- **Opções em Avaliação:**
  - **Opção A (Exclusivo Pro com cota):** Liberar acesso somente para assinantes Pro com franquia de 10 gerações/mês (custo controlado de ~$0.50 a $1.00/mês por usuário ativo).
  - **Opção B (Conversão no Trial):** Conceder 1 ou 2 gerações de demonstração durante o período de 15 dias de Trial gratuito para acelerar a conversão para o plano Pro.
  - **Opção C (Créditos Avulsos):** Implementar compra de pacotes de créditos extras via Stripe Checkout para usuários que esgotarem sua cota mensal.
- **Impacto / Ações Técnicas:** Rodar a migration `0001_tryon_predictions.sql` no Supabase de produção, regenerar os tipos (`database.ts`), construir a UI com seleção de fotos de corpo e look, e alterar `TRYON_ENABLED = true`.

---

## 2. Experiência e Interface do Histórico de Outfits Usados (`outfit_history`)

- **Contexto:** A tabela `outfit_history` existe no banco PostgreSQL desde o MVP, mas atualmente não possui nenhuma interface gráfica para o usuário final.
- **Decisão Necessária:** Qual o formato ideal de exibição e interação com o histórico de looks usados.
- **Opções em Avaliação:**
  - **Opção A (Calendário Mensal Visual):** Criar uma visualização de calendário em `/lookbook/calendario` exibindo os dias do mês com as miniaturas das roupas vestidas em cada data.
  - **Opção B (Linha do Tempo / Feed de Histórico):** Criar uma lista cronológica reversa simples com fotos, data de uso e botão rápido "Vestir novamente".
  - **Opção C (Integração Direta com a Mia AI):** Fazer a Mia perguntar no chat "O que você vestiu hoje?" e registrar automaticamente no histórico via processamento de linguagem natural.
- **Impacto / Ações Técnicas:** Criação da interface de registro diário (ação rápida nos cards de outfit) e da visualização de calendário ou feed.

---

## 3. Renovação Visual da Landing Page com Elementos do Produto Real

- **Contexto:** A landing page (`/`) foi projetada na versão v1.2.1 utilizando ilustrações conceituais em aquarela. O produto hoje (v1.9.0) possui uma identidade nórdica de luxo muito mais atraente no Armário Interativo e na Arara de Outfits.
- **Decisão Necessária:** Redesenhar as seções da landing page para exibir capturas e demonstrações reais do app.
- **Opções em Avaliação:**
  - **Opção A (Hero Interativo / Vídeo Demo):** Manter o estilo minimalista mas incluir no Hero uma prévia visual dinâmica do Armário Interativo com as roupas deslizando nos cabides.
  - **Opção B (Seção Vitrine de Features):** Manter a ilustração aquarela atual no Hero e introduzir logo abaixo uma seção com screenshots em alta definição do Armário, da Arara e da Análise Mia AI.
- **Impacto / Ações Técnicas:** Captura de telas limpas (sem dados pessoais) e atualização dos componentes em `src/app/(public)/page.tsx`.

---

## 4. Política de Segurança de Conteúdo (CSP) Bloqueante

- **Contexto:** A política CSP está operando no modo de relatório (`Content-Security-Policy-Report-Only`), monitorando fontes permitidas (Supabase, Stripe, Sentry, Google Analytics e fontes do Google).
- **Decisão Necessária:** Momento de transição para o modo bloqueante estrito (`Content-Security-Policy`).
- **Opções em Avaliação:**
  - **Opção A (Ativação Imediata):** Mudar o header para bloqueante já que nenhum erro foi registrado nas últimas sessões de deploy.
  - **Opção B (Transição Pós-Sentry):** Aguardar o preenchimento da variável `NEXT_PUBLIC_SENTRY_DSN` na Vercel para monitorar relatórios por mais 7 dias antes de bloquear.
- **Impacto / Ações Técnicas:** Alteração de chave em `next.config.ts`.

---

## 5. Decomposição Modular do Monolito [`closet/page.tsx`](file:///home/marcos-ranauro/Projetos/outfit-saas/src/app/(dashboard)/closet/page.tsx)

- **Contexto:** A página principal do closet ultrapassou 800 linhas, concentrando estados de busca, filtros, wishlist, onboarding e modais de inserção de peça.
- **Decisão Necessária:** Como e quando executar a refatoração do arquivo.
- **Opções em Avaliação:**
  - **Opção A (Refatoração Incremental Pré-TryOn):** Extrair imediatamente subcomponentes isolados (`ClosetContextBar`, `ClosetFilterBar`, `ClosetModalsWrap`) para facilitar a manutenção e testes.
  - **Opção B (Manutenção Atual):** Manter o arquivo unificado até que as próximas features funcionais (Try-On ou Histórico) sejam finalizadas, evitando retrabalho em branches paralelas.
- **Impacto / Ações Técnicas:** Criação de componentes em `src/components/closet/` e isolamento de estados locais.
