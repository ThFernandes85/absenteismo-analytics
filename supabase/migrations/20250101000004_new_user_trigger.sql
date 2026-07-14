-- =========================================================================
-- Cria automaticamente uma linha em public.profiles quando um usuário é
-- criado no Supabase Auth (via convite/admin). full_name e role vêm dos
-- metadados do usuário (user_metadata), definidos pelo Admin Master ao
-- convidar o usuário.
-- =========================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, cost_center_id, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'assistente_administrativo'),
    nullif(new.raw_user_meta_data ->> 'cost_center_id', '')::uuid,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
