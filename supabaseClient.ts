
import { createClient } from '@supabase/supabase-js';

// CREDENCIALES DE ENTORNO - Seguras y configurables
// Las credenciales se cargan desde variables de entorno (.env)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://szscgmqkcwlzceyisbpi.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6c2NnbXFrY3dsemNleWlzYnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzE5NDQsImV4cCI6MjA3OTk0Nzk0NH0.oIUV9doUFs2Rpa0iC1PD4X8TdGkubx_yQlntfnry0io';

export const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
