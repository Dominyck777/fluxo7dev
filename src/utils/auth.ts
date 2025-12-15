import type { Developer } from './jsonbin-client';
import { supabase } from './supabase-client';

interface UsuarioRow {
  id: string;
  name: string;
  password: string;
  avatar: string | null;
  role: string;
  active: boolean;
}

export async function authenticateUserSupabase(
  userId: string,
  password: string
): Promise<Developer | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, name, password, avatar, role, active')
    .eq('id', userId)
    .eq('password', password)
    .eq('active', true)
    .maybeSingle<UsuarioRow>();

  if (error) {
    console.error('[auth] Erro ao autenticar usuário no Supabase:', error);
    throw error;
  }

  if (!data) return null;

  const dev: Developer = {
    id: data.id,
    name: data.name,
    avatar: data.avatar ?? undefined,
    password: data.password,
    role: (data.role as Developer['role']) ?? 'developer',
    active: data.active,
  };

  return dev;
}
