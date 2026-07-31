alter table public.company_settings add column if not exists overtime_hour_rate numeric(10, 2) not null default 0;
