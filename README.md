# Controle de Absenteísmo

Sistema corporativo de controle de absenteísmo: cadastro de funcionários, lançamento de presenças/faltas/atestados/declarações/horas extras, dashboard com indicadores, calendário, auditoria completa e exportação de relatórios.

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + Supabase (Postgres/Auth/Storage) + React Router + React Hook Form + Zod + TanStack Query + Recharts + DayJS.

## 1. Criar o projeto no Supabase

1. Crie uma conta e um novo projeto em [supabase.com](https://supabase.com) (plano gratuito atende o MVP).
2. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**.
3. Copie `.env.example` para `.env` e preencha:

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA_PUBLICA
   ```

## 2. Aplicar o schema do banco

As migrations estão em `supabase/migrations/`, na ordem em que devem ser executadas:

1. `20250101000000_schema.sql` — tabelas, enums, índices
2. `20250101000001_rls_policies.sql` — Row Level Security por perfil (RBAC)
3. `20250101000002_audit_triggers.sql` — auditoria automática e imutável
4. `20250101000003_storage.sql` — bucket de anexos (atestados/declarações)
5. `20250101000004_new_user_trigger.sql` — criação automática de perfil ao convidar um usuário
6. `20250101000005_diretoria_role.sql` — adiciona o perfil **Diretoria** (somente leitura)
7. `20250101000006_executive_dashboard.sql` — tabela `company_settings` e liberação de leitura para a Diretoria

**Opção A — Supabase CLI** (recomendado, requer Docker/CLI instalados):

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

**Opção B — SQL Editor do Dashboard** (não requer instalar nada): abra cada arquivo acima, nessa ordem, e execute **um de cada vez** no **SQL Editor** do painel do Supabase — o arquivo 5 precisa terminar (commitar) antes de rodar o 6, pois ele usa o novo valor de enum criado no 5.

Depois, rode o conteúdo de `supabase/seed.sql` para criar os centros de custo de exemplo.

## 3. Criar o primeiro usuário (Admin Master)

No Dashboard do Supabase, vá em **Authentication > Users > Add user** e crie o usuário com **User Metadata**:

```json
{
  "full_name": "Nome do Administrador",
  "role": "admin_master"
}
```

O trigger `on_auth_user_created` cria automaticamente o perfil correspondente em `public.profiles`. Para os demais perfis (`gerente_unidade`, `assistente_administrativo`, `diretoria`), repita o processo trocando o `role`.

Depois de criar o Admin Master, acesse **Configurações** no app e preencha o **custo médio por dia perdido** e a **meta de absenteísmo (%)** — esses valores alimentam o Painel Executivo.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` e entre com o e-mail/senha do usuário criado no passo 3.

## Estrutura do projeto

```
src/
  components/ui/       componentes base (Button, Input, Modal, Combobox, ExportMenu...)
  components/layout/   shell, sidebar, topbar, rotas protegidas
  contexts/            AuthContext (Supabase Auth + perfil/role), ThemeContext (claro/escuro)
  features/
    auth/               tela de login
    employees/          cadastro, listagem, ocultos, detalhe/histórico, medidas administrativas
    occurrences/         lançamento de presença/falta/atestado/declaração/hora extra + anexos
    dashboard/           KPIs, gráficos (Recharts), impacto em horas, filtros de período
    calendar/            calendário corporativo mês a mês
    audit/                trilha de auditoria (somente Admin Master)
    admin/                usuários/permissões, centros de custo e configurações (somente Admin Master)
    executive/            Painel Executivo (Admin Master + Diretoria), com identidade visual própria
  lib/                  supabase client, export (PDF/Excel/CSV), constantes, permissões
  types/                 tipos de domínio (espelham o schema do Postgres)
supabase/
  migrations/            schema, RLS, triggers de auditoria, storage
  seed.sql                dados de exemplo (centros de custo)
```

## Perfis e permissões (RBAC)

| Ação | Admin Master | Gerente da Unidade | Assistente Administrativo | Diretoria |
|---|---|---|---|---|
| Gerenciar perfil/permissão/centro de lucro dos usuários | ✅ | ❌ | ❌ | ❌ |
| Cadastrar centros de lucro (sites) | ✅ | ❌ | ❌ | ❌ |
| Ver módulo de Auditoria | ✅ | ❌ | ❌ | ❌ |
| Cadastrar/editar/desativar funcionários | ✅ | ✅ | ✅ | ❌ |
| Lançar ocorrências | ✅ | ✅ | ✅ | ❌ |
| Exportar relatórios | ✅ | ✅ | ✅ | ✅ |
| Ver Dashboard operacional | ✅ | ✅ | ✅ | ❌ |
| Ver Painel Executivo | ✅ | ❌ | ❌ | ✅ |

**Diretoria** é um perfil somente leitura: enxerga o Painel Executivo (KPIs, tendência, ranking por unidade) e pode exportar relatórios, mas não lança ocorrências nem edita cadastros — reforçado tanto na UI quanto no RLS (`can_view()` libera leitura, `is_staff()` continua exigido para qualquer escrita).

Todas as regras acima são aplicadas em duas camadas: no cliente (`src/lib/permissions.ts`) e, de forma definitiva, via Row Level Security no Postgres (`supabase/migrations/20250101000001_rls_policies.sql`).

A criação de um usuário **novo** (Auth) continua exigindo o Dashboard do Supabase (passo 3 acima), pois depende da `service_role key`, que nunca deve ser exposta no cliente. Depois de criado, o Admin Master pode ajustar perfil, centro de lucro e situação em **Administração → Usuários e Permissões** dentro do próprio app.

## Nota sobre tipos do Supabase

O client em `src/lib/supabase.ts` não usa o generic `Database` do `@supabase/supabase-js`: a versão instalada exige um formato de tipos (`Relationships`, `__InternalSupabase` etc.) que só é gerado corretamente pela CLI oficial (`supabase gen types typescript`) contra um projeto real — o que requer Docker/projeto vivo, indisponíveis neste ambiente de desenvolvimento. Os tipos de domínio em `src/types/database.types.ts` espelham manualmente o schema SQL e são usados para tipar as entradas/saídas de cada hook em `src/features/*/api.ts`. **Assim que o projeto Supabase estiver no ar**, rode `npx supabase gen types typescript --project-id SEU_PROJECT_REF > src/types/database.types.ts` e reative o generic `Database` em `src/lib/supabase.ts` para ganhar checagem de tipos ponta a ponta nas queries.

## Roadmap (estrutura já preparada para evoluir)

- Importação de funcionários via Excel/CSV
- API REST / integração com ERP, Power BI, WhatsApp, Teams
- Notificações automáticas (excesso de faltas, atestados consecutivos)
- Multiempresa (multi-tenant)
- App mobile, QR Code, reconhecimento facial, integração com relógio de ponto
- IA para previsão de índices de absenteísmo
