alter table public.position_overtime_rates add column if not exists rate_50 numeric(10, 2) not null default 0;
alter table public.position_overtime_rates add column if not exists rate_100 numeric(10, 2) not null default 0;
alter table public.position_overtime_rates drop column if exists hourly_rate;
