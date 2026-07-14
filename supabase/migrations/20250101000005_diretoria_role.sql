-- =========================================================================
-- Novo perfil: Diretoria (acesso somente leitura ao Painel Executivo)
-- Precisa rodar em uma transação própria antes de qualquer uso do valor,
-- por isso fica isolado neste arquivo.
-- =========================================================================
alter type public.user_role add value if not exists 'diretoria';
