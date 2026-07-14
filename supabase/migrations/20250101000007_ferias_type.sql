-- =========================================================================
-- Novo tipo de ocorrência: Férias
-- Precisa rodar em uma transação própria antes de qualquer uso do valor,
-- por isso fica isolado neste arquivo.
-- =========================================================================
alter type public.occurrence_type add value if not exists 'ferias';
