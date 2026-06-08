-- Tabela de fotos das peças
create table if not exists piece_photos (
  id          uuid primary key default gen_random_uuid(),
  piece_id    uuid references pieces(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  url         text not null,
  is_cover    boolean default false,
  is_studio   boolean default false,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- RLS
alter table piece_photos enable row level security;

create policy "Usuário vê próprias fotos"
  on piece_photos for select
  using (auth.uid() = user_id);

create policy "Usuário insere próprias fotos"
  on piece_photos for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza próprias fotos"
  on piece_photos for update
  using (auth.uid() = user_id);

create policy "Usuário exclui próprias fotos"
  on piece_photos for delete
  using (auth.uid() = user_id);

-- Índice
create index piece_photos_piece_id_idx on piece_photos(piece_id);
