-- =========================================================================
-- Férias e Atestado passam a usar período (data de início + data de
-- retorno) em vez de "quantidade de dias" digitada manualmente. O
-- days_count passa a ser calculado a partir do período no próprio app.
--
-- Nenhum outro lançamento (presença, falta, hora extra, outro atestado...)
-- pode ser feito para o colaborador dentro desse período — garantido por
-- uma constraint de exclusão a nível de banco (não depende de validação
-- no cliente). end_date é o dia de RETORNO (exclusivo): o período coberto
-- é [occurrence_date, end_date), então o próprio dia de retorno já fica
-- livre para outros lançamentos (ex.: presença).
-- =========================================================================
create extension if not exists btree_gist;

alter table public.occurrences add column if not exists end_date date;

-- Backfill de registros existentes (lançados antes desta migração),
-- assumindo end_date = data de retorno = occurrence_date + days_count.
update public.occurrences
set end_date = (occurrence_date + (days_count || ' days')::interval)::date
where type in ('atestado', 'ferias') and end_date is null and days_count is not null;

alter table public.occurrences drop constraint if exists occurrences_days_count_check;
alter table public.occurrences
  add constraint occurrences_days_count_check check (
    type not in ('atestado', 'ferias') or (days_count is not null and days_count > 0 and end_date is not null)
  );

alter table public.occurrences drop constraint if exists occurrences_one_per_employee_per_day;
alter table public.occurrences drop constraint if exists occurrences_no_overlap;

-- ATENÇÃO: se ainda existirem lançamentos genuinamente sobrepostos para o
-- mesmo colaborador (ex.: dois atestados que se cruzam de verdade), este
-- comando falha com "conflicting key value violates exclusion constraint".
-- Nesse caso, ajuste/remova o registro conflitante manualmente.
alter table public.occurrences
  add constraint occurrences_no_overlap
  exclude using gist (
    employee_id with =,
    daterange(occurrence_date, coalesce(end_date, occurrence_date + 1)) with &&
  );
