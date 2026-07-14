-- Seed de desenvolvimento: centros de lucro de exemplo.
-- Executado automaticamente por `supabase db reset`.
insert into public.cost_centers (code, name) values
  ('CL-001', 'Matriz'),
  ('CL-002', 'Unidade Filial 01')
on conflict (code) do nothing;

-- O primeiro usuário Admin Master deve ser criado via Supabase Auth
-- (Dashboard > Authentication > Add user) com user_metadata:
--   { "full_name": "Nome do Admin", "role": "admin_master" }
-- O trigger on_auth_user_created criará o perfil automaticamente.
