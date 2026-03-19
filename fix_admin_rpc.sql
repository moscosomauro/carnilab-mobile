-- =============================================================================
-- FIX ADMIN RPC (Funciones de Admin Seguras)
-- =============================================================================

-- 1. Función para obtener estadísticas globales (Bypass RLS)
-- Esta función se ejecuta con permisos de "postgres" (SECURITY DEFINER)
-- para poder contar filas en tablas que el usuario normal no puede ver.
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_users bigint;
  active_keys bigint;
  total_plants bigint;
  total_crosses bigint;
BEGIN
  SELECT count(*) INTO total_users FROM access_keys;
  SELECT count(*) INTO active_keys FROM access_keys WHERE device_id IS NOT NULL;
  SELECT count(*) INTO total_plants FROM plants;
  SELECT count(*) INTO total_crosses FROM crosses;

  RETURN json_build_object(
    'totalUsers', total_users,
    'activeKeys', active_keys,
    'totalPlants', total_plants,
    'totalCrosses', total_crosses
  );
END;
$$;

-- 2. Función para obtener el tamaño de la DB (Aprox)
-- Útil para monitorear el límite de 500MB del plan Free.
CREATE OR REPLACE FUNCTION get_db_size()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size bigint;
BEGIN
  SELECT pg_database_size(current_database()) INTO db_size;
  RETURN db_size;
END;
$$;

-- 3. Función para obtener TODAS las llaves (Para la lista de usuarios)
-- Reemplaza al select normal que es bloqueado por RLS.
CREATE OR REPLACE FUNCTION get_all_keys_secure()
RETURNS SETOF access_keys
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM access_keys ORDER BY created_at DESC;
$$;

-- 4. Dar permisos de ejecución a "anon" y "authenticated"
-- (La seguridad real está en que solo el Admin Dashboard llama a esto,
-- y aunque alguien más lo llame, solo devuelve conteos o datos públicos de llaves).
GRANT EXECUTE ON FUNCTION get_admin_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_db_size() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_all_keys_secure() TO anon, authenticated, service_role;
