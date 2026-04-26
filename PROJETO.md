# Outfit SaaS — Documentação do Projeto

## Stack
- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Estilo:** Tailwind CSS v4 + CSS customizado (dark premium)
- **Banco:** Supabase (PostgreSQL) — região São Paulo
- **Auth:** Supabase Auth (email/senha + Google OAuth)
- **Storage:** Supabase Storage (buckets: pieces, avatars)
- **IA:** Anthropic API (claude-sonnet-4-6)
- **Deploy:** Vercel (pendente)

## Identidade Visual
- Tema: Dark premium (preto com dourado/cobre)
- Cores principais: #080808 (fundo), #111111 (card), rgba(180,140,60) (dourado)
- Fontes: Inter (corpo) + Bebas Neue (títulos)
- Mobile first em todos os componentes

## Estrutura do Banco
- `profiles` → dados do usuário (nome, altura, peso, plano free/pro)
- `pieces` → peças do closet com foto
- `outfits` → combinações salvas com tags de estilo, ocasião, período e "por que funciona"
- `outfit_history` → histórico de outfits usados
- Trigger: `on_auth_user_created` → cria perfil automaticamente no cadastro

## Storage
- `pieces` → fotos das roupas (organizado por user_id)
- `avatars` → foto de perfil do usuário

## Planos
- **Free:** limitado
- **Pro:** R$ 29/mês — ilimitado
- **Stylist:** R$ 79/mês — multi-closet

## Fases do Projeto
- [x] Fase 0 — Setup (Next.js, Supabase, variáveis de ambiente)
- [x] Fase 0.1 — Conexão Supabase (client, server, middleware, tipos)
- [x] Fase 1 — Auth (login, cadastro, Google OAuth, trigger de perfil)
- [x] Fase 2 — Closet (cadastrar peças, upload de foto, excluir)
- [x] Fase 3 — Lookbook (outfits salvos, filtros por período e ocasião, detalhe)
- [x] Fase 4 — Outfit IA (clima, período, ocasião, gerar 5 outfits, salvar)
- [ ] Fase 5 — Perfil (nome, altura, peso, estilo, avatar, logout)
- [ ] Fase 6 — Deploy (Vercel)
- [ ] Fase 7 — Monetização (Stripe)

## Arquivos criados
- `src/lib/supabase/client.ts` → conexão client-side
- `src/lib/supabase/server.ts` → conexão server-side
- `src/middleware.ts` → proteção de rotas autenticadas
- `src/types/database.ts` → tipos TypeScript do banco
- `src/app/layout.tsx` → fontes e estrutura base
- `src/app/globals.css` → reset e estilos base
- `src/app/auth.css` → estilos dark premium (login/cadastro)
- `src/app/dashboard.css` → layout dashboard e bottom nav
- `src/app/closet.css` → estilos do closet
- `src/app/outfit-ia.css` → estilos do outfit IA
- `src/app/lookbook.css` → estilos do lookbook
- `src/app/(auth)/login/page.tsx` → página de login
- `src/app/(auth)/cadastro/page.tsx` → página de cadastro
- `src/app/auth/callback/route.ts` → callback Google OAuth
- `src/app/page.tsx` → redirect automático
- `src/app/(dashboard)/layout.tsx` → layout dashboard com bottom nav
- `src/app/(dashboard)/closet/page.tsx` → closet completo
- `src/app/(dashboard)/lookbook/page.tsx` → lookbook com filtros
- `src/app/(dashboard)/outfit-ia/page.tsx` → outfit IA com clima
- `src/app/api/weather/route.ts` → API de clima (Open-Meteo)
- `src/app/api/outfit/generate/route.ts` → API de geração de outfits
- `src/components/layout/BottomNav.tsx` → navegação inferior

## Decisões Técnicas
- App Router do Next.js (não Pages Router)
- Tailwind v4 com @import — CSS customizado em arquivos separados por página
- Google OAuth configurado no Google Cloud Console + Supabase
- Row Level Security ativado em todas as tabelas
- Storage público para URLs de imagem direta
- font-size 16px nos inputs para evitar zoom automático no iOS
- Clima via Open-Meteo (gratuito, sem API key)
- Geolocalização via browser + Nominatim para nome da cidade
- IA gera 5 outfits por vez — usuário salva os que gostar
- Outfits salvos ficam no Lookbook filtrados por período e ocasião
- Modelo Anthropic: claude-sonnet-4-6