-- =========================================================================
-- Auditoria automática (imutável) via triggers SECURITY DEFINER
-- =========================================================================

create function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  v_role public.user_role;
begin
  -- Supabase/PostgREST expõe os headers da requisição via GUC "request.headers".
  begin
    v_ip := coalesce(
      nullif(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
      'desconhecido'
    );
  exception when others then
    v_ip := 'desconhecido';
  end;

  v_role := public.current_user_role();

  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, user_role, action, table_name, record_id, old_data, new_data, ip_address)
    values (auth.uid(), v_role, 'INSERT', tg_table_name, new.id, null, to_jsonb(new), v_ip);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (user_id, user_role, action, table_name, record_id, old_data, new_data, ip_address)
    values (auth.uid(), v_role, 'UPDATE', tg_table_name, new.id, to_jsonb(old), to_jsonb(new), v_ip);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (user_id, user_role, action, table_name, record_id, old_data, new_data, ip_address)
    values (auth.uid(), v_role, 'DELETE', tg_table_name, old.id, to_jsonb(old), null, v_ip);
    return old;
  end if;
  return null;
end;
$$;

create trigger employees_audit
  after insert or update or delete on public.employees
  for each row execute function public.log_audit();

create trigger occurrences_audit
  after insert or update or delete on public.occurrences
  for each row execute function public.log_audit();

create trigger administrative_measures_audit
  after insert or update or delete on public.administrative_measures
  for each row execute function public.log_audit();

create trigger attachments_audit
  after insert or delete on public.attachments
  for each row execute function public.log_audit();

create trigger profiles_audit
  after insert or update or delete on public.profiles
  for each row execute function public.log_audit();
