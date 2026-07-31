alter table public.company_settings drop column if exists overtime_hour_rate;

create table if not exists public.position_overtime_rates (
  position text primary key,
  hourly_rate numeric(10, 2) not null default 0,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

alter table public.position_overtime_rates enable row level security;

create or replace trigger position_overtime_rates_set_updated_at before update on public.position_overtime_rates
  for each row execute function public.set_updated_at();

drop policy if exists position_overtime_rates_select on public.position_overtime_rates;
create policy position_overtime_rates_select on public.position_overtime_rates
  for select using (public.can_view());

drop policy if exists position_overtime_rates_admin on public.position_overtime_rates;
create policy position_overtime_rates_admin on public.position_overtime_rates
  for all using (public.is_admin_master()) with check (public.is_admin_master());
