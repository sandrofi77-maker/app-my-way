-- Cria bucket para imagens da aplicação
insert into storage.buckets (id, name, public)
values ('trip-images', 'trip-images', true)
on conflict (id) do nothing;

-- Política: usuário autenticado pode fazer upload em sua própria pasta
drop policy if exists "Trip images upload" on storage.objects;
create policy "Trip images upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuário autenticado pode atualizar seus próprios arquivos
drop policy if exists "Trip images update" on storage.objects;
create policy "Trip images update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'trip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuário autenticado pode deletar seus próprios arquivos
drop policy if exists "Trip images delete" on storage.objects;
create policy "Trip images delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: leitura pública (bucket público)
drop policy if exists "Trip images public read" on storage.objects;
create policy "Trip images public read"
on storage.objects
for select
to public
using (bucket_id = 'trip-images');
