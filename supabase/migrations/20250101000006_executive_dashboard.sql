-- =========================================================================
-- Suporte ao Painel Executivo (perfil Diretoria)
-- =========================================================================

-- -------------------------------------------------------------------------
-- Configurações da empresa (linha única) — custo médio por dia perdido,
-- usado para estimar o impacto financeiro do absenteísmo.
-- -------------------------------------------------------------------------
create table public.company_settings (
  id smallint primary key default 1,
  average_daily_cost numeric(10, 2) not null default 0,
  target_absenteeism_rate numeric(5, 2) not null default 3.00,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);

insert into public.company_settings (id, average_daily_cost) values (1, 0)
on conflict (id) do nothing;

create trigger company_settings_set_updated_at before update on public.company_settings
  for each row execute function public.set_updated_at();

alter table public.company_settings enable row level security;

-- -------------------------------------------------------------------------
-- Helper: leitura liberada para qualquer perfil ativo, incluindo Diretoria.
-- Escrita continua restrita a is_staff() (Diretoria é somente leitura).
-- -------------------------------------------------------------------------
create function public.can_view()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_active();
$$;

create policy company_settings_select on public.company_settings
  for select using (public.can_view());

create policy company_settings_update on public.company_settings
  for update using (public.is_admin_master()) with check (public.is_admin_master());

-- -------------------------------------------------------------------------
-- Amplia leitura (SELECT) das tabelas operacionais para incluir Diretoria,
-- mantendo escrita restrita aos três perfis operacionais (is_staff()).
-- -------------------------------------------------------------------------
drop policy cost_centers_select on public.cost_centers;
create policy cost_centers_select on public.cost_centers
  for select using (public.can_view());

drop policy employees_select on public.employees;
create policy employees_select on public.employees
  for select using (public.can_view());

drop policy occurrences_select on public.occurrences;
create policy occurrences_select on public.occurrences
  for select using (public.can_view());

drop policy attachments_select on public.attachments;
create policy attachments_select on public.attachments
  for select using (public.can_view());

drop policy administrative_measures_select on public.administrative_measures;
create policy administrative_measures_select on public.administrative_measures
  for select using (public.can_view());
