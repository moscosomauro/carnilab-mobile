// Cliente de Supabase para el sync por la nube (opcional).
// Si no hay claves configuradas (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY),
// `supabase` queda en null y la app sigue funcionando 100% local. La nube es
// solo un intermediario para que el iPhone capture en el campo sin la PC y, al
// prender la PC, todo baje al escritorio.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cloudConfigured = !!(url && anonKey && url.startsWith('http'));

export const supabase: SupabaseClient | null = cloudConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
