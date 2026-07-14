-- =========================================================================
-- Controle de Absenteísmo - Schema inicial
-- =========================================================================
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- Centros de custo (sites)
-- -------------------------------------------------------------------------
create table public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- Perfis (estende auth.users)
-- -------------------------------------------------------------------------
create type public.user_role as enum ('admin_master', 'gerente_unidade', 'assistente_administrativo');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'assistente_administrativo',
  cost_center_id uuid references public.cost_centers (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- Funcionários
-- -------------------------------------------------------------------------
create type public.employee_status as enum ('ativo', 'inativo');

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  full_name text not null,
  position text not null,
  department text not null,
  cost_center_id uuid not null references public.cost_centers (id),
  admission_date date not null,
  status public.employee_status not null default 'ativo',
  notes text,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employees_full_name_idx on public.employees (full_name);
create index employees_status_idx on public.employees (status);
create index employees_department_idx on public.employees (department);
create index employees_cost_center_idx on public.employees (cost_center_id);

-- -------------------------------------------------------------------------
-- Ocorrências (presença, falta, atestado, declaração, hora extra)
-- -------------------------------------------------------------------------
create type public.occurrence_type as enum ('presenca', 'falta', 'atestado', 'declaracao', 'hora_extra');
create type public.overtime_percentage as enum ('50', '100');

create table public.occurrences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  occurrence_date date not null,
  type public.occurrence_type not null,
  notes text,
  -- falta
  reason text,
  -- atestado
  days_count int,
  cid text,
  -- declaração de comparecimento
  time_of_day time,
  -- hora extra
  hours numeric(5, 2),
  overtime_percentage public.overtime_percentage,
  -- auditoria de autoria
  responsible_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occurrences_one_per_employee_per_day unique (employee_id, occurrence_date),
  constraint occurrences_days_count_check check (
    type <> 'atestado' or days_count is not null and days_count > 0
  ),
  constraint occurrences_hours_check check (
    type <> 'hora_extra' or (hours is not null and hours > 0 and overtime_percentage is not null)
  )
);

create index occurrences_employee_idx on public.occurrences (employee_id);
create index occurrences_date_idx on public.occurrences (occurrence_date);
create index occurrences_type_idx on public.occurrences (type);

-- -------------------------------------------------------------------------
-- Anexos (atestados, declarações) - metadados; arquivos ficam no Storage
-- -------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size int not null,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index attachments_occurrence_idx on public.attachments (occurrence_id);

-- -------------------------------------------------------------------------
-- Medidas administrativas (termo de orientação, advertência, suspensão)
-- -------------------------------------------------------------------------
create type public.measure_type as enum ('termo_orientacao', 'advertencia', 'suspensao');

create table public.administrative_measures (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type public.measure_type not null,
  measure_date date not null,
  description text not null,
  suspension_days int,
  attachment_path text,
  responsible_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint administrative_measures_suspension_days_check check (
    type <> 'suspensao' or (suspension_days is not null and suspension_days > 0)
  )
);

create index administrative_measures_employee_idx on public.administrative_measures (employee_id);

-- -------------------------------------------------------------------------
-- Auditoria (imutável)
-- -------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id),
  user_role public.user_role,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_user_idx on public.audit_log (user_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- -------------------------------------------------------------------------
-- updated_at helper
-- -------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger employees_set_updated_at before update on public.employees
  for each row execute function public.set_updated_at();

create trigger occurrences_set_updated_at before update on public.occurrences
  for each row execute function public.set_updated_at();
