-- =========================================================================
-- Row Level Security
-- =========================================================================

-- -------------------------------------------------------------------------
-- Helpers (security definer para evitar recursão de RLS em profiles)
-- -------------------------------------------------------------------------
create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_user_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false);
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_active()
    and public.current_user_role() in ('admin_master', 'gerente_unidade', 'assistente_administrativo');
$$;

create function public.is_admin_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_active() and public.current_user_role() = 'admin_master';
$$;

-- -------------------------------------------------------------------------
-- cost_centers
-- -------------------------------------------------------------------------
alter table public.cost_centers enable row level security;

create policy cost_centers_select on public.cost_centers
  for select using (public.is_staff());

create policy cost_centers_write on public.cost_centers
  for all using (public.is_admin_master()) with check (public.is_admin_master());

-- -------------------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin_master());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_admin_master());

create policy profiles_admin_insert on public.profiles
  for insert with check (public.is_admin_master());

create policy profiles_admin_delete on public.profiles
  for delete using (public.is_admin_master());

-- -------------------------------------------------------------------------
-- employees
-- -------------------------------------------------------------------------
alter table public.employees enable row level security;

create policy employees_select on public.employees
  for select using (public.is_staff());

create policy employees_insert on public.employees
  for insert with check (public.is_staff());

create policy employees_update on public.employees
  for update using (public.is_staff()) with check (public.is_staff());

-- exclusão física nunca é permitida via API; soft delete é um update.
create policy employees_no_delete on public.employees
  for delete using (false);

-- -------------------------------------------------------------------------
-- occurrences
-- -------------------------------------------------------------------------
alter table public.occurrences enable row level security;

create policy occurrences_select on public.occurrences
  for select using (public.is_staff());

create policy occurrences_insert on public.occurrences
  for insert with check (public.is_staff());

create policy occurrences_update on public.occurrences
  for update using (public.is_staff()) with check (public.is_staff());

create policy occurrences_delete on public.occurrences
  for delete using (public.is_staff());

-- -------------------------------------------------------------------------
-- attachments
-- -------------------------------------------------------------------------
alter table public.attachments enable row level security;

create policy attachments_select on public.attachments
  for select using (public.is_staff());

create policy attachments_insert on public.attachments
  for insert with check (public.is_staff());

create policy attachments_delete on public.attachments
  for delete using (public.is_staff());

-- -------------------------------------------------------------------------
-- administrative_measures
-- -------------------------------------------------------------------------
alter table public.administrative_measures enable row level security;

create policy administrative_measures_select on public.administrative_measures
  for select using (public.is_staff());

create policy administrative_measures_insert on public.administrative_measures
  for insert with check (public.is_staff());

create policy administrative_measures_update on public.administrative_measures
  for update using (public.is_staff()) with check (public.is_staff());

-- -------------------------------------------------------------------------
-- audit_log: somente Admin Master visualiza; escrita apenas via trigger
-- (security definer), nunca diretamente pelo client.
-- -------------------------------------------------------------------------
alter table public.audit_log enable row level security;

create policy audit_log_select on public.audit_log
  for select using (public.is_admin_master());

create policy audit_log_no_client_write on public.audit_log
  for insert with check (false);
