# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Planned
- Redesign do Lookbook
- Redesign do Chat Mia
- Email transacional personalizado (Resend)
- Histórico de outfits usados com UI (`outfit_history`)
- Notificações push
- Publicação na Play Store via TWA/Capacitor

---

## [1.2.0] — 2026-05-23

### Added
- Foto de estúdio com Remove.bg — remoção de fundo com fidelidade 100% ao produto original
- Análise multi-foto via Mia: nova rota `/api/pieces/describe` envia até 3 fotos para `claude-sonnet-4-6` e retorna descrição técnica visual em inglês
- Galeria de múltiplas fotos (até 6) na página Nova Peça com seleção de capa
- Campos `color_secondary`, `description` e `notes` nas peças (com migration SQL)
- Análise automática ao selecionar foto — sem botão manual, Mia preenche os campos instantaneamente
- Modal de confirmação centralizado para foto de estúdio (saiu do bottom sheet)
- Modal de loading com spinner dourado durante geração de foto de estúdio
- Dica de foto no modal de confirmação ("apoie a peça em superfície lisa...")
- Rate limiting para rota `/api/pieces/studio` (`studio_generate`: 10/mês free, 999/mês pro)
- SSRF protection na rota de estúdio — validação de hostname contra Supabase antes de fetch
- Histórico de implementações comentado no código do estúdio (gpt-image-1 → Photoroom → Fal.ai → Remove.bg)
- `.env.example` com todas as variáveis de ambiente documentadas
- `DECISOES.md` com registro de decisões técnicas (ADR)
- `CHANGELOG.md` (este arquivo)
- `SECURITY.md` com políticas de segurança e reporte de vulnerabilidades

### Fixed
- Hydration mismatch no estado de colunas do closet (`useState` inicializado com valor fixo + `useEffect` para leitura do `localStorage`)
- CSS inline migrado para classes em 6 arquivos (`login`, `cadastro`, `closet`, `lookbook`, `mia`, `perfil`)
- Logs de debug removidos de produção (3 logs em `describe/route.ts`, 1 log de chave API em `tryon/route.ts`)
- Tipos `any` substituídos por interfaces tipadas em `closet/page.tsx`, `perfil/page.tsx`, `mia/chat/route.ts` e `stripe/webhook/route.ts`
- Texto do modal de estúdio atualizado para refletir o novo comportamento (Remove.bg em vez de gpt-image-1)

### Security
- Validação de URLs contra domínio do Supabase antes de qualquer `fetch()` na rota `/api/pieces/studio`
- Rate limiting adicionado em `/api/pieces/studio`

---

## [1.1.0] — 2026-05-22

### Added
- Sistema de trial de 15 dias — coluna `trial_ends_at` no banco, lógica no rate limit, banner no perfil com dias restantes
- Virtual Try-On com FASHN.ai — seleção múltipla e sequencial de peças, polling com limite de 30 tentativas, badge numérico de ordem de aplicação
- Foto de estúdio com `gpt-image-1` (substituído por Remove.bg em 1.2.0): 3 ângulos em paralelo, rate limiting, SSRF protection
- Redesign completo do Dashboard: nova paleta claro/escuro (`--dash-*` CSS vars), Bottom Nav dinâmico, DashboardTopBanner
- Redesign do Closet: grid 1–5 colunas, drawer de filtros dinâmico, chips de grupo (Roupas / Calçados / Acessórios), peça âncora
- Persistência de colunas do grid via `localStorage`
- Página Nova Peça (`/closet/nova-peca`) criada com upload, análise Mia automática, galeria, compressão
- Redesign das páginas de Auth com toggle claro/escuro e fundo DALL-E
- Redesign da Landing page com ilustrações aquarela, ticker animado, IntersectionObserver
- Página `/sobre` com história e missão do produto
- FAQ com accordion, 4 categorias, 12 perguntas

### Fixed
- Contador de Outfits no closet era `0` hardcoded — agora query real na tabela `outfits`
- Contadores compartilhados entre `mia_chat` e `outfit_generate` — colunas separadas
- Bug de closure em `handleGenerate` com `previousOutfits` e `usedPieceIds`

### Security
- Webhook Stripe valida assinatura HMAC antes de processar qualquer evento
- `SUPABASE_SERVICE_ROLE_KEY` usada apenas no webhook (server-side only)

---

## [1.0.0] — 2026-05-01

### Added
- Auth completo: email/senha + Google OAuth, recuperação de senha, confirmação de e-mail
- Closet: CRUD completo de peças com foto, compressão automática, upload para Supabase Storage
- Análise automática de peças com visão computacional (`/api/pieces/analyze`)
- Lookbook: outfits salvos com filtros por período (dia/noite) e ocasião, modal de detalhe, exclusão
- Chat Mia com personalidade carioca, quick actions, cards de outfit inline, typing indicator, peça âncora, suporte a data futura
- Wishlist com sugestões de IA: prioridade alta/média/baixa, salvar, marcar como comprado, pré-preencher Nova Peça
- Geração de outfits com clima via Open-Meteo + Anthropic, bloqueio de peças já usadas entre gerações
- Perfil completo: avatar crop circular (400×400 JPEG), edição de nome/altura/peso/estilo, banner de plano
- Stripe: checkout, webhook com validação HMAC, portal de gerenciamento de assinatura
- Rate limiting por plano em todas as rotas de IA
- PWA: service worker network-first, página offline, manifest completo, botão de instalação Android e instrução iOS
- Google Analytics (G-BE79RBHKKT)
- Páginas legais: Termos de Uso, Política de Privacidade
- Tour guiado do closet (exibido uma vez após onboarding)
- Onboarding modal de perfil dentro do closet
- Deploy em produção: [miaoutfitai.com.br](https://miaoutfitai.com.br)

### Security
- RLS ativo em todas as tabelas do Supabase
- Autenticação verificada no início de todas as rotas de API
- Nenhuma chave de API exposta no client bundle
