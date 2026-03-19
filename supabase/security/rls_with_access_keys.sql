-- ============================================
-- CARNILAB - RLS CON ACCESS_KEYS
-- Versión ajustada para tu arquitectura
-- Fecha: 2026-01-14
-- ============================================

-- ============================================
-- PASO 1: CREAR FUNCIÓN HELPER
-- Esta función obtiene el owner_key del usuario actual
-- ============================================

CREATE OR REPLACE FUNCTION get_current_user_key()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT key
  FROM access_keys
  WHERE device_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================
-- PASO 2: HABILITAR RLS
-- ============================================

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 3: POLÍTICAS PARA PLANTS
-- ============================================

CREATE POLICY "users_view_own_plants"
ON plants FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "users_insert_own_plants"
ON plants FOR INSERT
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_update_own_plants"
ON plants FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_delete_own_plants"
ON plants FOR DELETE
USING (owner_key = get_current_user_key());

-- Permitir ver plantas públicas (vivero online)
CREATE POLICY "public_view_plants_for_sale"
ON plants FOR SELECT
USING (en_venta = true);

-- ============================================
-- PASO 4: POLÍTICAS PARA CROSSES
-- ============================================

CREATE POLICY "users_view_own_crosses"
ON crosses FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "users_insert_own_crosses"
ON crosses FOR INSERT
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_update_own_crosses"
ON crosses FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_delete_own_crosses"
ON crosses FOR DELETE
USING (owner_key = get_current_user_key());

-- ============================================
-- PASO 5: POLÍTICAS PARA ALERTS
-- ============================================

CREATE POLICY "users_view_own_alerts"
ON alerts FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "users_insert_own_alerts"
ON alerts FOR INSERT
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_update_own_alerts"
ON alerts FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_delete_own_alerts"
ON alerts FOR DELETE
USING (owner_key = get_current_user_key());

-- ============================================
-- PASO 6: POLÍTICAS PARA DIARY
-- ============================================

CREATE POLICY "users_view_own_diary"
ON diary FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "users_insert_own_diary"
ON diary FOR INSERT
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_update_own_diary"
ON diary FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_delete_own_diary"
ON diary FOR DELETE
USING (owner_key = get_current_user_key());

-- ============================================
-- PASO 7: POLÍTICAS PARA CLIMATE_LOGS
-- ============================================

CREATE POLICY "users_view_own_climate"
ON climate_logs FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "users_insert_own_climate"
ON climate_logs FOR INSERT
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_update_own_climate"
ON climate_logs FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_delete_own_climate"
ON climate_logs FOR DELETE
USING (owner_key = get_current_user_key());

-- ============================================
-- PASO 8: POLÍTICAS PARA INBOX_MESSAGES
-- ============================================

-- IMPORTANTE: Verificar que la columna sender_key existe
-- Si no existe, agregarla primero:
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS sender_key TEXT;

CREATE POLICY "users_view_received_messages"
ON inbox_messages FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "users_view_sent_messages"
ON inbox_messages FOR SELECT
USING (sender_key = get_current_user_key() OR sender_key IS NULL);

CREATE POLICY "users_send_messages"
ON inbox_messages FOR INSERT
WITH CHECK (sender_key = get_current_user_key() OR sender_key IS NULL);

CREATE POLICY "users_update_received_messages"
ON inbox_messages FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

-- ============================================
-- PASO 9: POLÍTICAS PARA SHOP_PRODUCTS
-- ============================================

CREATE POLICY "users_view_own_products"
ON shop_products FOR SELECT
USING (owner_key = get_current_user_key());

CREATE POLICY "public_view_active_products"
ON shop_products FOR SELECT
USING (active = true);

CREATE POLICY "users_insert_own_products"
ON shop_products FOR INSERT
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_update_own_products"
ON shop_products FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

CREATE POLICY "users_delete_own_products"
ON shop_products FOR DELETE
USING (owner_key = get_current_user_key());

-- ============================================
-- PASO 10: POLÍTICAS PARA SHOP_ORDERS
-- ============================================

CREATE POLICY "sellers_view_own_orders"
ON shop_orders FOR SELECT
USING (owner_key = get_current_user_key());

-- Permitir insertar órdenes sin autenticación (checkout público)
CREATE POLICY "anyone_can_create_orders"
ON shop_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "sellers_update_own_orders"
ON shop_orders FOR UPDATE
USING (owner_key = get_current_user_key())
WITH CHECK (owner_key = get_current_user_key());

-- ============================================
-- PASO 11: VERIFICACIÓN
-- ============================================

-- Verificar RLS habilitado
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'plants', 'crosses', 'alerts', 'diary',
    'climate_logs', 'inbox_messages',
    'shop_products', 'shop_orders'
  )
ORDER BY tablename;

-- Listar todas las políticas
SELECT
  tablename,
  policyname,
  cmd AS operation,
  CASE
    WHEN qual IS NOT NULL THEN 'USING'
    WHEN with_check IS NOT NULL THEN 'WITH CHECK'
    ELSE 'N/A'
  END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- TESTING MANUAL
-- ============================================

/*
1. Crear dos usuarios de prueba:
   - Usuario A: test1@example.com
   - Usuario B: test2@example.com

2. Usuario A crea una planta:
   INSERT INTO plants (nombre, especie, owner_key)
   VALUES ('Test Plant A', 'S. purpurea', 'USER_A_KEY');

3. Usuario B intenta ver plantas de Usuario A:
   SELECT * FROM plants; -- Solo debe ver sus propias plantas

4. Usuario B intenta modificar planta de Usuario A:
   UPDATE plants SET nombre = 'Hacked' WHERE owner_key = 'USER_A_KEY';
   -- Debe fallar con error de permissions

5. Verificar vivero público:
   -- Sin autenticación, ejecutar:
   SELECT * FROM plants WHERE en_venta = true;
   -- Debe retornar plantas públicas

SUCCESS: Si todo falla correctamente, RLS está funcionando ✅
*/

-- ============================================
-- ROLLBACK (SI ALGO FALLA)
-- ============================================

/*
-- Deshacer todo:
DROP POLICY IF EXISTS "users_view_own_plants" ON plants;
DROP POLICY IF EXISTS "users_insert_own_plants" ON plants;
DROP POLICY IF EXISTS "users_update_own_plants" ON plants;
DROP POLICY IF EXISTS "users_delete_own_plants" ON plants;
DROP POLICY IF EXISTS "public_view_plants_for_sale" ON plants;
-- ... repetir para todas las tablas

DROP FUNCTION IF EXISTS get_current_user_key();

ALTER TABLE plants DISABLE ROW LEVEL SECURITY;
ALTER TABLE crosses DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE diary DISABLE ROW LEVEL SECURITY;
ALTER TABLE climate_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders DISABLE ROW LEVEL SECURITY;
*/
