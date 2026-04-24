# Outfit SaaS — Documentação do Projeto

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Estilo:** Tailwind CSS
- **Banco:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (buckets: pieces, avatars)
- **IA:** Anthropic API (claude-sonnet)
- **Deploy:** Vercel

## Estrutura do Banco
- `profiles` → dados do usuário (nome, altura, peso, plano free/pro)
- `pieces` → peças do closet com foto
- `outfits` → combinações salvas com tags de estilo e ocasião
- `outfit_history` → histórico de outfits usados

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
- [ ] Fase 1 — Auth (cadastro, login, perfil)
- [ ] Fase 2 — Closet (cadastrar peças, upload de foto)
- [ ] Fase 3 — Lookbook (outfits, filtros, tags)
- [ ] Fase 4 — Outfit IA (sugestão por clima e ocasião)
- [ ] Fase 5 — Monetização (Stripe, planos)

## Contexto do App
Baseado em um PWA pessoal chamado MARCOS LOOKBOOK.
- Usuário: 1.80m, 88kg, Streetwear/Sportwear
- 39 outfits catalogados manualmente
- App original tinha: closet, lookbook com filtros, sugestão por IA + clima

## Decisões Técnicas
- App Router do Next.js (não Pages Router)
- Supabase região São Paulo
- Row Level Security ativado em todas as tabelas
- Storage público para URLs de imagem direta

## Arquivos criados
- `src/lib/supabase/client.ts` → conexão client-side
- `src/lib/supabase/server.ts` → conexão server-side
- `src/middleware.ts` → proteção de rotas autenticadas
- `src/types/database.ts` → tipos TypeScript do banco