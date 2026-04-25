# Outfit SaaS — Documentação do Projeto

## Stack
- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Estilo:** Tailwind CSS v4 + CSS customizado (dark premium)
- **Banco:** Supabase (PostgreSQL) — região São Paulo
- **Auth:** Supabase Auth (email/senha + Google OAuth)
- **Storage:** Supabase Storage (buckets: pieces, avatars)
- **IA:** Anthropic API (claude-sonnet)
- **Deploy:** Vercel (pendente)

## Identidade Visual
- Tema: Dark premium (preto com dourado/cobre)
- Cores principais: #080808 (fundo), #111111 (card), rgba(180,140,60) (dourado)
- Fontes: Inter (corpo) + Bebas Neue (títulos)
- Mobile first em todos os componentes

## Estrutura do Banco
- `profiles` → dados do usuário (nome, altura, peso, plano free/pro)
- `pieces` → peças do closet com foto
- `outfits` → combinações salvas com tags de estilo e ocasião
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
- [ ] Fase 2 — Closet (cadastrar peças, upload de foto)
- [ ] Fase 3 — Lookbook (outfits, filtros, tags)
- [ ] Fase 4 — Outfit IA (sugestão por clima e ocasião)
- [ ] Fase 5 — Monetização (Stripe, planos)

## Arquivos criados
- `src/lib/supabase/client.ts` → conexão client-side
- `src/lib/supabase/server.ts` → conexão server-side
- `src/middleware.ts` → proteção de rotas autenticadas
- `src/types/database.ts` → tipos TypeScript do banco
- `src/app/layout.tsx` → fontes e estrutura base
- `src/app/globals.css` → reset e estilos base
- `src/app/auth.css` → estilos dark premium (login/cadastro)
- `src/app/(auth)/login/page.tsx` → página de login
- `src/app/(auth)/cadastro/page.tsx` → página de cadastro
- `src/app/auth/callback/route.ts` → callback Google OAuth
- `src/app/page.tsx` → redirect automático (logado → closet, deslogado → login)

## Decisões Técnicas
- App Router do Next.js (não Pages Router)
- Tailwind v4 com @import ao invés de @tailwind directives
- CSS customizado em arquivo separado (auth.css) por compatibilidade com Tailwind v4
- Google OAuth configurado no Google Cloud Console + Supabase
- Row Level Security ativado em todas as tabelas
- Storage público para URLs de imagem direta
- font-size 16px nos inputs para evitar zoom automático no iOS