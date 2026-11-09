-- 0007: uploads passam a ser feitos só pelo servidor (POST /api/storage/upload, service role),
-- que valida, re-encoda e modera a imagem antes de gravar. O usuário não escreve mais direto no Storage.
-- APLICAR SOMENTE DEPOIS do deploy do código que usa /api/storage/upload.

-- 1. Sem INSERT/UPDATE direto pelo cliente
drop policy if exists "Users can upload to pieces bucket" on storage.objects;
drop policy if exists "Usuário faz upload das próprias fotos" on storage.objects;
drop policy if exists "Usuário faz upload do próprio avatar" on storage.objects;
drop policy if exists "Usuário atualiza próprio avatar" on storage.objects;

-- 2. Qualquer usuário logado conseguia listar os arquivos de todos (URLs públicas seguem funcionando)
drop policy if exists "Users can read pieces bucket" on storage.objects;

-- 3. Defesa em profundidade nos buckets
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('pieces', 'avatars');
