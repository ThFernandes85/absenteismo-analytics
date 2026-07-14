-- =========================================================================
-- Justificativa obrigatória ao desativar um funcionário (soft delete).
-- O histórico completo (valor anterior/novo) já fica preservado para
-- sempre em audit_log via o trigger log_audit, mesmo que este campo seja
-- limpo numa reativação futura.
-- =========================================================================
alter table public.employees add column if not exists deactivation_reason text;
