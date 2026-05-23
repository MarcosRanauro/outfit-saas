# Política de Segurança — Mia Outfit AI

## Como reportar uma vulnerabilidade

Se você encontrou uma vulnerabilidade de segurança neste projeto, **não abra uma issue pública**.

Entre em contato por e-mail: **marcosranauro85@gmail.com**

Inclua:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de correção (se houver)

Vulnerabilidades confirmadas serão corrigidas em até 7 dias úteis. Você será creditado na correção (a menos que prefira anonimato).

---

## Práticas de segurança do projeto

### Autenticação e autorização

- **Supabase Auth** gerencia sessões via cookies HTTP-only — nenhum token JWT é exposto no `localStorage`
- Todas as rotas de API verificam `supabase.auth.getUser()` antes de qualquer operação
- **Row Level Security (RLS)** ativo em todas as tabelas — queries sem `user_id` válido retornam vazio
- Google OAuth configurado com callback restrito às URLs autorizadas no Google Cloud Console

### Proteção de APIs externas

- **SSRF protection**: URLs de imagem recebidas pelo servidor são validadas contra o hostname do `NEXT_PUBLIC_SUPABASE_URL` antes de qualquer `fetch()`. URLs de outros domínios retornam 400.
- **Rate limiting** por usuário e por ação em todas as rotas de IA — limites armazenados na tabela `profiles` com reset mensal
- **Webhook Stripe**: assinatura HMAC validada via `stripe.webhooks.constructEvent()` antes de processar qualquer evento

### Variáveis de ambiente

| Variável | Exposição permitida | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend + Backend | Prefixo `NEXT_PUBLIC_` — exposta no bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend + Backend | Prefixo `NEXT_PUBLIC_` — exposta no bundle. Protegida por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas backend | **Nunca** usar em Client Components. Usada apenas no webhook do Stripe |
| `ANTHROPIC_API_KEY` | Apenas backend | Usada em rotas de API — nunca exposta ao browser |
| `REMOVE_BG_API_KEY` | Apenas backend | Usada em rotas de API — nunca exposta ao browser |
| `FASHN_API_KEY` | Apenas backend | Usada em rotas de API — nunca exposta ao browser |
| `STRIPE_SECRET_KEY` | Apenas backend | Usada em rotas de API — nunca exposta ao browser |
| `STRIPE_WEBHOOK_SECRET` | Apenas backend | Usado para validar assinaturas do webhook |
| `STRIPE_PRICE_ID` | Apenas backend | ID do plano Pro no Stripe |
| `NEXT_PUBLIC_APP_URL` | Frontend + Backend | URL de produção — usada para chamadas server-to-server |

**Regra:** qualquer variável sem o prefixo `NEXT_PUBLIC_` **nunca** deve ser importada em arquivos com `'use client'` ou em componentes de cliente.

### Storage

- Fotos de peças ficam em `pieces/{user_id}/{filename}` — bucket público
- Avatares ficam em `avatars/{user_id}/avatar.jpg` — bucket público
- O path por `user_id` é obscurity (não autenticação) — trade-off aceito pois o produto não lida com dados sensíveis
- Fotos de estúdio ficam em `pieces/studio/{user_id}/{timestamp}_{i}.png`
- Fotos de input do estúdio ficam em `pieces/studio-input/{user_id}/{timestamp}_{i}.jpg`

### Código

- Nenhum segredo é logado em produção — logs de diagnóstico temporários são removidos antes de merge
- `console.error` em rotas de API logam apenas `message`, `status` e `code` — nunca o stack completo ou dados do usuário
- Inputs externos não são interpolados em queries SQL (Supabase client usa prepared statements internamente)

---

## Política de dados do usuário

### Dados coletados

| Dado | Onde fica | Por quê |
|---|---|---|
| E-mail | Supabase Auth | Autenticação e recuperação de senha |
| Nome, altura, peso, estilo | `profiles` | Personalização das sugestões da Mia |
| Foto de avatar | Supabase Storage (`avatars/`) | Identificação visual no perfil |
| Fotos de peças | Supabase Storage (`pieces/`) | Análise visual e exibição no closet |
| Peças e outfits | `pieces`, `outfits` | Funcionalidade central do produto |
| Histórico de chat | Não persistido — apenas na sessão | Contexto da conversa com a Mia |
| Dados de pagamento | Stripe (nunca no nosso banco) | Cobrança do plano Pro |
| `stripe_customer_id` | `profiles` | Associar assinatura ao usuário |

### Dados NÃO coletados

- Senhas (gerenciadas pelo Supabase Auth — nunca tocamos)
- Dados de cartão de crédito (gerenciados pelo Stripe — nunca passam pelo nosso servidor)
- Localização (usamos apenas clima via Open-Meteo, sem armazenar coordenadas)
- Histórico de chat (mensagens não são persistidas no banco)

### Exclusão de conta

Para excluir todos os dados, o usuário deve entrar em contato via e-mail. A exclusão remove:
- Perfil e dados pessoais da tabela `profiles`
- Todas as peças e outfits
- Fotos do Storage
- Assinatura no Stripe (se ativa)

---

## Versões suportadas

| Versão | Suportada |
|---|---|
| 1.2.x (atual) | ✅ |
| 1.1.x | ⚠️ Atualize para 1.2.x |
| < 1.1.0 | ❌ |
