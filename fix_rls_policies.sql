-- =============================================================================
-- FIX RLS POLICIES FOR CARNILAB (Auth Integration)
-- =============================================================================
-- Este script arregla los permisos para que los usuarios logueados (Auth)
-- puedan guardar datos usando su 'owner_key' (Licencia).

-- 1. Habilitar RLS en todas las tablas (por seguridad)
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- 2. Definir la política de lectura/escritura correcta
-- La lógica es: "Permitir si el 'owner_key' de la fila coincide con la 'key' asignada al usuario logueado"

-- --- PLANTS ---
DROP POLICY IF EXISTS "Users can manage their own plants" ON public.plants;
CREATE POLICY "Users can manage their own plants" ON public.plants
FOR ALL
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
)
WITH CHECK (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);

-- --- CROSSES ---
DROP POLICY IF EXISTS "Users can manage their own crosses" ON public.crosses;
CREATE POLICY "Users can manage their own crosses" ON public.crosses
FOR ALL
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
)
WITH CHECK (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);

-- --- ALERTS ---
DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.alerts;
CREATE POLICY "Users can manage their own alerts" ON public.alerts
FOR ALL
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
)
WITH CHECK (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);

-- --- DIARY ---
DROP POLICY IF EXISTS "Users can manage their own diary" ON public.diary;
CREATE POLICY "Users can manage their own diary" ON public.diary
FOR ALL
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
)
WITH CHECK (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);

-- --- CLIMATE LOGS ---
DROP POLICY IF EXISTS "Users can manage their own climate" ON public.climate_logs;
CREATE POLICY "Users can manage their own climate" ON public.climate_logs
FOR ALL
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
)
WITH CHECK (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);

-- --- INBOX MESSAGES ---
-- Los usuarios pueden VER sus propios mensajes
DROP POLICY IF EXISTS "Users can view their inbox" ON public.inbox_messages;
CREATE POLICY "Users can view their inbox" ON public.inbox_messages
FOR SELECT
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);

-- Permitir INSERT a cualquiera (público) para que te puedan enviar mensajes
DROP POLICY IF EXISTS "Public can send messages" ON public.inbox_messages;
CREATE POLICY "Public can send messages" ON public.inbox_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir UPDATE (marcar como leído) solo al dueño
DROP POLICY IF EXISTS "Users can update their inbox" ON public.inbox_messages;
CREATE POLICY "Users can update their inbox" ON public.inbox_messages
FOR UPDATE
TO authenticated
USING (
  owner_key IN (SELECT key FROM public.access_keys WHERE device_id = auth.uid())
);
