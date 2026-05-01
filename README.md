# Outfit AI

Aplicativo SaaS de moda com inteligência artificial. Usuários cadastram 
suas peças, e a Mia — nossa stylist IA — gera outfits personalizados 
baseados no clima, ocasião e estilo de cada pessoa.

## Sobre o projeto

O Outfit AI nasceu de um lookbook pessoal e evoluiu para um produto 
completo com múltiplos usuários, autenticação, storage de fotos na 
nuvem e integração com IA de visão computacional.

## Funcionalidades

- **Closet** — Cadastro de peças com foto, categorias e filtros
- **Outfit IA** — Geração de 5 outfits por vez com base no clima real 
  (atual ou futuro), período do dia e ocasião
- **Lookbook** — Outfits salvos, filtráveis por período e ocasião
- **Wishlist** — Sugestões de peças para comprar baseadas no closet atual
- **Perfil** — Dados pessoais, avatar com crop circular e histórico de uso
- **Mia** — Stylist IA com visão computacional que analisa as fotos 
  reais das peças para combinações mais precisas

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilo | Tailwind CSS v4 + CSS customizado |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/senha + Google OAuth) |
| Storage | Supabase Storage |
| IA | Anthropic API (claude-sonnet-4-6) |
| Clima | Open-Meteo (gratuito, sem API key) |
| Deploy | Vercel |

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
ANTHROPIC_API_KEY=sua_chave_aqui
```

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/          # Login e cadastro
│   ├── (dashboard)/     # Área logada (closet, lookbook, outfit-ia, perfil)
│   └── api/             # Rotas de backend (clima, geração de outfits, wishlist)
├── components/          # Componentes reutilizáveis
├── lib/supabase/        # Configuração do Supabase
└── types/               # Tipos TypeScript
```

## Planos

| Plano | Preço | Limite |
|---|---|---|
| Free | R$ 0 | Limitado |
| Pro | R$ 29/mês | Ilimitado |
| Stylist | R$ 79/mês | Multi-closet |

---

Desenvolvido com Next.js, Supabase e Anthropic API.
