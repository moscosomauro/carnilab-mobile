-- ============================================
-- CARNILAB - ROW LEVEL SECURITY (RLS)
-- Implementación de políticas de seguridad
-- Fecha: 2026-01-14
-- ============================================

-- ============================================
-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS
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
-- PASO 2: POLÍTICAS PARA TABLA PLANTS
-- ============================================

-- Permitir SELECT solo de plantas propias
CREATE POLICY "users_view_own_plants"
ON plants FOR SELECT
USING (owner_key = auth.uid());

-- Permitir INSERT solo con owner_key propio
CREATE POLICY "users_insert_own_plants"
ON plants FOR INSERT
WITH CHECK (owner_key = auth.uid());

-- Permitir UPDATE solo de plantas propias
CREATE POLICY "users_update_own_plants"
ON plants FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

-- Permitir DELETE solo de plantas propias
CREATE POLICY "users_delete_own_plants"
ON plants FOR DELETE
USING (owner_key = auth.uid());

-- Permitir ver plantas públicas (en_venta = true)
CREATE POLICY "public_view_plants_for_sale"
ON plants FOR SELECT
USING (en_venta = true);

-- ============================================
-- PASO 3: POLÍTICAS PARA TABLA CROSSES
-- ============================================

CREATE POLICY "users_view_own_crosses"
ON crosses FOR SELECT
USING (owner_key = auth.uid());

CREATE POLICY "users_insert_own_crosses"
ON crosses FOR INSERT
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_update_own_crosses"
ON crosses FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_delete_own_crosses"
ON crosses FOR DELETE
USING (owner_key = auth.uid());

-- ============================================
-- PASO 4: POLÍTICAS PARA TABLA ALERTS
-- ============================================

CREATE POLICY "users_view_own_alerts"
ON alerts FOR SELECT
USING (owner_key = auth.uid());

CREATE POLICY "users_insert_own_alerts"
ON alerts FOR INSERT
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_update_own_alerts"
ON alerts FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_delete_own_alerts"
ON alerts FOR DELETE
USING (owner_key = auth.uid());

-- ============================================
-- PASO 5: POLÍTICAS PARA TABLA DIARY
-- ============================================

CREATE POLICY "users_view_own_diary"
ON diary FOR SELECT
USING (owner_key = auth.uid());

CREATE POLICY "users_insert_own_diary"
ON diary FOR INSERT
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_update_own_diary"
ON diary FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_delete_own_diary"
ON diary FOR DELETE
USING (owner_key = auth.uid());

-- ============================================
-- PASO 6: POLÍTICAS PARA TABLA CLIMATE_LOGS
-- ============================================

CREATE POLICY "users_view_own_climate"
ON climate_logs FOR SELECT
USING (owner_key = auth.uid());

CREATE POLICY "users_insert_own_climate"
ON climate_logs FOR INSERT
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_update_own_climate"
ON climate_logs FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

CREATE POLICY "users_delete_own_climate"
ON climate_logs FOR DELETE
USING (owner_key = auth.uid());

-- ============================================
-- PASO 7: POLÍTICAS PARA TABLA INBOX_MESSAGES
-- ============================================

-- Ver mensajes recibidos
CREATE POLICY "users_view_received_messages"
ON inbox_messages FOR SELECT
USING (owner_key = auth.uid());

-- Ver mensajes enviados
CREATE POLICY "users_view_sent_messages"
ON inbox_messages FOR SELECT
USING (sender_key = auth.uid());

-- Insertar mensajes (verificar que sender_key sea el usuario actual)
CREATE POLICY "users_send_messages"
ON inbox_messages FOR INSERT
WITH CHECK (sender_key = auth.uid());

-- Actualizar solo mensajes recibidos (para marcar como leído)
CREATE POLICY "users_update_received_messages"
ON inbox_messages FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

-- ============================================
-- PASO 8: POLÍTICAS PARA TABLA SHOP_PRODUCTS
-- ============================================

-- Ver productos propios
CREATE POLICY "users_view_own_products"
ON shop_products FOR SELECT
USING (owner_key = auth.uid());

-- Ver productos activos públicamente
CREATE POLICY "public_view_active_products"
ON shop_products FOR SELECT
USING (active = true);

-- Insertar productos propios
CREATE POLICY "users_insert_own_products"
ON shop_products FOR INSERT
WITH CHECK (owner_key = auth.uid());

-- Actualizar productos propios
CREATE POLICY "users_update_own_products"
ON shop_products FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

-- Eliminar productos propios
CREATE POLICY "users_delete_own_products"
ON shop_products FOR DELETE
USING (owner_key = auth.uid());

-- ============================================
-- PASO 9: POLÍTICAS PARA TABLA SHOP_ORDERS
-- ============================================

-- Ver órdenes propias (como vendedor)
CREATE POLICY "sellers_view_own_orders"
ON shop_orders FOR SELECT
USING (owner_key = auth.uid());

-- Insertar órdenes (cualquiera puede comprar, incluso sin auth)
CREATE POLICY "anyone_can_create_orders"
ON shop_orders FOR INSERT
WITH CHECK (true);

-- Actualizar órdenes propias (como vendedor)
CREATE POLICY "sellers_update_own_orders"
ON shop_orders FOR UPDATE
USING (owner_key = auth.uid())
WITH CHECK (owner_key = auth.uid());

-- ============================================
-- PASO 10: VERIFICACIÓN
-- ============================================

-- Verificar que RLS esté habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'plants', 'crosses', 'alerts', 'diary',
    'climate_logs', 'inbox_messages',
    'shop_products', 'shop_orders'
  );

-- Verificar políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. ✅ EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR

2. ✅ auth.uid() retorna el ID del usuario autenticado de Supabase Auth
   - Si usas "device_id" en access_keys, vincularlo correctamente

3. ⚠️ IMPORTANTE: Si tus usuarios usan "owner_key" que NO es auth.uid():
   - Deberás ajustar las políticas para usar la lógica de access_keys
   - Ejemplo alternativo:
     USING (owner_key = (SELECT key FROM access_keys WHERE device_id = auth.uid()))

4. ✅ Las políticas públicas permiten:
   - Ver plantas en venta (vivero online)
   - Ver productos activos (marketplace)
   - Crear órdenes sin autenticación (checkout)

5. ✅ TESTING:
   - Crear 2 usuarios diferentes
   - Intentar que Usuario A vea plantas de Usuario B
   - Debe fallar con error de permissions

6. ✅ ADMIN BYPASS:
   - Los admins pueden usar service_role key para bypass RLS
   - En dashboard admin, usar RPCs con security definer

7. ✅ ROLLBACK (si algo falla):
   DROP POLICY IF EXISTS "nombre_de_politica" ON tabla_name;
   ALTER TABLE tabla_name DISABLE ROW LEVEL SECURITY;
*/
