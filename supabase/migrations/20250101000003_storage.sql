-- =========================================================================
-- Storage: bucket de anexos (atestados, declarações, medidas administrativas)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;

create policy attachments_storage_select on storage.objects
  for select using (bucket_id = 'attachments' and public.is_staff());

create policy attachments_storage_insert on storage.objects
  for insert with check (bucket_id = 'attachments' and public.is_staff());

create policy attachments_storage_delete on storage.objects
  for delete using (bucket_id = 'attachments' and public.is_staff());
