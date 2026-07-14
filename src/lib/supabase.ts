import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).',
  )
}

// O client não usa o generic `Database` do supabase-js: a versão instalada
// exige um formato de tipos (Relationships, __InternalSupabase etc.) gerado
// exclusivamente pela CLI oficial (`supabase gen types`) contra um projeto
// real. Sem Docker/projeto vivo neste ambiente, tipamos manualmente as
// entradas e saídas de cada hook em `src/features/*/api.ts` usando os tipos
// de domínio em `src/types/database.types.ts`.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
