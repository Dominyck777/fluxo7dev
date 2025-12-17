import { supabase } from './supabase-client';
import type { Developer } from './jsonbin-client';

export const supabaseDevs = {
  async updateDeveloperName(id: string, name: string): Promise<Developer | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ name })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[supabase-devs] Erro ao atualizar nome do desenvolvedor:', error);
      return null;
    }

    return data as Developer;
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop() ?? 'png';
    const filePath = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[supabase-devs] Erro ao fazer upload do avatar:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData?.publicUrl;
    if (!avatarUrl) {
      console.error('[supabase-devs] Não foi possível obter URL pública do avatar');
      return null;
    }

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar: avatarUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('[supabase-devs] Erro ao atualizar avatar na tabela usuarios:', updateError);
      return null;
    }

    return avatarUrl;
  },
};
