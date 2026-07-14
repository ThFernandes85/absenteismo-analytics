-- =========================================================================
-- Nova situação de funcionário: Afastado (licença médica longa, INSS,
-- licença maternidade, etc.) — distinta de Ativo e de Inativo (soft
-- delete). Precisa rodar em transação própria antes de qualquer uso do
-- valor, por isso fica isolado neste arquivo.
-- =========================================================================
alter type public.employee_status add value if not exists 'afastado';
