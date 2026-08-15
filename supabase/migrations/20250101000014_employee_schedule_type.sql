do $$
begin
  if not exists (select 1 from pg_type where typname = 'employee_schedule_type') then
    create type public.employee_schedule_type as enum ('padrao', 'escala_3x3');
  end if;
end $$;

alter table public.employees add column if not exists schedule_type public.employee_schedule_type not null default 'padrao';
alter table public.employees add column if not exists schedule_reference_date date;
