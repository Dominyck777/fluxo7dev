import type { Developer } from './jsonbin-client';
import { supabase } from './supabase-client';

interface UsuarioRow {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  active: boolean;
}

export async function authenticateUserSupabase(
  userId: string,
  password: string
): Promise<Developer | null> {
  const { data, error } = await supabase
    .rpc('authenticate_usuario', {
      p_id: userId,
      p_password: password,
    })
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
    // senha não é mais retornada nem usada no front
    password: '',
    role: (data.role as Developer['role']) ?? 'developer',
    active: data.active,
  };

  return dev;
}
