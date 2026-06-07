-- Correção 05 — Ownership em /api/tryon/status
-- Associa cada predictionId da FASHN ao user_id que a criou, para que a
-- rota de status só retorne predictions do próprio usuário.

create table if not exists tryon_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  prediction_id text not null unique,
  piece_id uuid references pieces(id) on delete cascade,
  status text default 'processing',
  created_at timestamptz default now()
);

alter table tryon_predictions enable row level security;

create policy "Usuário vê próprias predictions"
  on tryon_predictions for select
  using (auth.uid() = user_id);

create policy "Usuário cria próprias predictions"
  on tryon_predictions for insert
  with check (auth.uid() = user_id);
