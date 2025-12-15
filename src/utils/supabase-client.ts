import { createClient } from '@supabase/supabase-js';

// URL e chave pública (anon) do Supabase
// Defina em um arquivo .env ou .env.local, por exemplo:
// VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
// VITE_SUPABASE_ANON_KEY=chave_anon_publica

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase-client] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
