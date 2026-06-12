# 📖 CARNILAB - ESTADO ACTUAL DEL PROYECTO

## 🎯 RESUMEN EJECUTIVO

**CarniLab** es una aplicación híbrida (Web PWA + Mobile) para gestión de colecciones de plantas carnívoras, con funcionalidades de:
- Gestión de plantas y cruces genéticos
- Diario de cultivo con detección automática de fases
- Sistema de gamificación (XP, niveles, objetivos diarios, 25 insignias)
- IA integrada (Gemini/OpenAI) para asistencia y análisis
- Banco de semillas con estratificación
- Marketplace y vivero público
- Modo offline completo

---

## 📂 UBICACIÓN DEL PROYECTO

```
Ruta: c:\Users\mosco\Downloads\Carnilab Mobil claud\
```

---

## ✅ CÓDIGO YA IMPLEMENTADO

### Estadísticas del Código Existente

| Categoría | Cantidad | Estado |
|-----------|----------|---------|
| **Pantallas (screens/)** | 27 | ✅ Implementadas |
| **Componentes (components/)** | 26 | ✅ Implementados |
| **Utilidades (utils/)** | 9 | ✅ Implementadas |
| **Contextos (context/)** | 4 | ✅ Implementados |
| **Edge Functions (supabase/functions/)** | 9 | ✅ Implementadas |
| **Total de líneas de código** | ~25,000+ | ✅ Funcional |

### Archivos de Configuración Existentes

✅ `package.json` - Con todas las dependencias instaladas
✅ `vite.config.ts` - Configuración de Vite + PWA
✅ `tailwind.config.js` - Configuración de Tailwind CSS
✅ `capacitor.config.ts` - Configuración de Capacitor
✅ `tsconfig.json` - Configuración de TypeScript
✅ `types.ts` - Todas las interfaces TypeScript definidas
✅ `theme.css` - Sistema de temas dark/light

---

## 🚀 FEATURES YA IMPLEMENTADAS

### ✅ Autenticación y Seguridad
- [x] Login/Registro con Supabase Auth
- [x] Sistema de licencias multi-tenant
- [x] Row Level Security (RLS) configurado
- [x] Recuperación de contraseña
- [x] Contexto de autenticación global

### ✅ Gestión de Plantas
- [x] CRUD completo de plantas
- [x] Upload de múltiples imágenes a Supabase Storage
- [x] Generación de códigos QR únicos
- [x] Carrusel de imágenes con miniaturas
- [x] Búsqueda y filtros con debounce
- [x] Vista de detalles con historial

### ✅ Diario de Cultivo
- [x] 3 modos de visualización (calendario, lista, bitácora histórica)
- [x] Detección automática de fases vegetativas (regex + días)
- [x] Tracking de altura y hojas
- [x] Galería de fotos por entrada
- [x] Filtros por planta y tipo de entrada

### ✅ Genética y Cruces
- [x] CRUD de cruces genéticos
- [x] Árbol genealógico visual (GenealogyTree)
- [x] Calculadora genética (plan Pro/Elite)
- [x] Análisis de cruces con IA
- [x] Seguimiento de semillas obtenidas/germinadas

### ✅ Banco de Semillas
- [x] CRUD de lotes de semillas
- [x] Estados de estratificación (3 fases)
- [x] Contador de días de estratificación
- [x] Notificaciones al completar

### ✅ Gamificación COMPLETA
- [x] Sistema de XP y 15 niveles
- [x] Objetivos diarios (3-5 según plan)
- [x] Sistema de rachas (días consecutivos)
- [x] 25 insignias en 5 categorías
- [x] 4 niveles de rareza (común, raro, épico, legendario)
- [x] Notificaciones de desbloqueo animadas
- [x] Event-driven architecture (objectiveEvents, badgeEvents)
- [x] Persistencia en localStorage

### ✅ Inteligencia Artificial
- [x] CarniBot AI (chat con contexto de botánica)
- [x] Análisis de imágenes con Gemini
- [x] Generador de nombres de cultivares
- [x] Análisis genético de cruces
- [x] Edge Functions para IA (carni-bot-ai, analyze-cross)

### ✅ Alertas y Clima
- [x] Sistema de alertas programadas
- [x] Notificaciones push (web-push)
- [x] Registro de clima (temperatura, humedad, luz)
- [x] Gráficos de clima histórico (Recharts)
- [x] Edge Function de procesamiento (process-alerts)
- [x] Cron job configurado

### ✅ Comunidad y Marketplace
- [x] Perfiles públicos con slug único
- [x] Vivero público (bypass RLS)
- [x] Sistema de mensajería P2P (Supabase Realtime)
- [x] Bandeja de entrada con badges
- [x] Marketplace para venta de plantas (plan Elite)

### ✅ PWA y Offline
- [x] Service Worker configurado
- [x] Estrategias de cache (Cache First, Network First)
- [x] Background Sync
- [x] manifest.json completo
- [x] Instalable en home screen
- [x] Indicadores de estado online/offline

### ✅ Mobile (Capacitor)
- [x] Configuración de Capacitor lista
- [x] Proyectos Android e iOS inicializados
- [x] Integración con Camera plugin
- [x] Integración con Filesystem
- [x] Integración con Haptics
- [x] Integración con Push Notifications
- [x] Splash screen y status bar configurados

### ✅ Sistema de Pagos
- [x] Integración con MercadoPago
- [x] Edge Functions de checkout y webhook
- [x] Sistema de upgrade de planes
- [x] Panel de administración de licencias
- [x] Panel de administración de precios

### ✅ UI/UX
- [x] Sistema de temas dark/light
- [x] Backgrounds animados (particles, decoraciones)
- [x] Animaciones con Framer Motion
- [x] Componente de lightbox para imágenes
- [x] Sistema de toasts/notificaciones
- [x] Responsive design completo
- [x] Iconografía con Lucide + custom icons

### ✅ Utilidades
- [x] Validación Zod en todos los formularios
- [x] Helpers de imágenes (upload, resize, compress)
- [x] Helpers de diario (detección de fases, agrupación)
- [x] Helpers de planes (verificación de features)
- [x] Logger con integración a Sentry
- [x] Custom hooks (debounce, media query, online status)

### ✅ Backup y Admin
- [x] Exportación completa a JSON
- [x] Importación de backup
- [x] Panel de estado del sistema
- [x] Logs de errores
- [x] Monitoreo con Sentry

---

## ⚙️ CONFIGURACIÓN REQUERIDA

### 1. Variables de Entorno

Crear archivo `.env` con:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# IA APIs
VITE_GEMINI_API_KEY=tu_gemini_key
VITE_OPENAI_API_KEY=tu_openai_key (opcional)

# Pagos
VITE_MERCADOPAGO_PUBLIC_KEY=tu_mp_public_key

# Monitoreo
VITE_SENTRY_DSN=tu_sentry_dsn (opcional)
```

### 2. Base de Datos Supabase

**Opción A: Usar migraciones existentes**
```bash
cd supabase
npx supabase db push
```

**Opción B: Ejecutar manualmente el SQL**
- Ver sección "Esquema de Base de Datos" en `GUIA_INGENIERO_SENIOR.md`
- Ejecutar en Supabase SQL Editor

**Configurar Storage:**
1. Crear bucket `plant-images` (público)
2. Configurar políticas de acceso (ver guía)

**Desplegar Edge Functions:**
```bash
npx supabase functions deploy carni-bot-ai
npx supabase functions deploy analyze-cross
npx supabase functions deploy process-alerts
npx supabase functions deploy send-push
npx supabase functions deploy mercadopago-checkout
npx supabase functions deploy mercadopago-webhook
npx supabase functions deploy generate-image
npx supabase functions deploy get-license-by-payment
npx supabase functions deploy push
```

**Configurar secrets:**
```bash
npx supabase secrets set OPENAI_API_KEY=xxx
npx supabase secrets set GEMINI_API_KEY=xxx
npx supabase secrets set MERCADOPAGO_ACCESS_TOKEN=xxx
npx supabase secrets set WEB_PUSH_PRIVATE_KEY=xxx
```

### 3. Instalación de Dependencias

```bash
npm install
```

Todas las dependencias ya están listadas en `package.json`.

---

## 🚀 CÓMO EJECUTAR EL PROYECTO

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará en http://localhost:5173
```

### Build para Producción

```bash
# Build de la aplicación web
npm run build

# Preview del build
npm run preview
```

### Build Mobile (Android)

```bash
# Build web primero
npm run build

# Sincronizar con Capacitor
npx cap sync android

# Abrir en Android Studio
npx cap open android

# En Android Studio: Build > Generate Signed Bundle / APK
```

### Build Mobile (iOS)

```bash
# Build web primero
npm run build

# Sincronizar con Capacitor
npx cap sync ios

# Abrir en Xcode
npx cap open ios

# En Xcode: Product > Archive
```

---

## 📋 TAREAS PENDIENTES (SI APLICAN)

### ⚠️ Configuración Inicial (Solo primera vez)

- [ ] Crear proyecto en Supabase
- [ ] Ejecutar migraciones de base de datos
- [ ] Crear bucket de Storage
- [ ] Configurar variables de entorno
- [ ] Desplegar Edge Functions
- [ ] Configurar secrets de Supabase
- [ ] Obtener API keys (Gemini, OpenAI, MercadoPago)

### 🔧 Ajustes según Necesidades

- [ ] Personalizar colores y branding (tailwind.config.js, theme.css)
- [ ] Configurar dominio personalizado
- [ ] Ajustar límites de planes (utils/planHelpers.ts)
- [ ] Personalizar objetivos diarios (utils/dailyObjectives.ts)
- [ ] Ajustar insignias disponibles (utils/badges.ts)
- [ ] Configurar precios de MercadoPago
- [ ] Personalizar prompts de IA (supabase/functions/carni-bot-ai/)

### 📱 Mobile (Opcional)

- [ ] Configurar keystore para Android
- [ ] Configurar certificados para iOS
- [ ] Configurar iconos y splash screens
- [ ] Subir a Google Play Store
- [ ] Subir a Apple App Store

### 🧪 Testing (Recomendado)

- [ ] Configurar Vitest
- [ ] Escribir tests unitarios de helpers
- [ ] Escribir tests de integración de contextos
- [ ] Tests E2E con Playwright (opcional)

---

## 📚 DOCUMENTACIÓN DISPONIBLE

### Documentos en este proyecto:

1. **GUIA_INGENIERO_SENIOR.md** ⭐ (COMPLETO - 900+ líneas)
   - Stack tecnológico completo
   - Arquitectura de datos con SQL
   - Descripción detallada de 27 pantallas
   - Descripción de 26 componentes
   - 9 utilidades explicadas
   - 9 Edge Functions documentadas
   - Sistema de gamificación completo
   - Configuración PWA y Capacitor
   - Guía de despliegue
   - Checklist de implementación

2. **DOC_00_INDICE.md**
   - Índice de documentación planificada (12 docs)
   - Quick start guide
   - Estructura general

3. **README_PROYECTO.md** (este archivo)
   - Estado actual del proyecto
   - Qué está implementado
   - Cómo ejecutar
   - Tareas pendientes

### Código fuente como documentación:

- `types.ts` - Todas las interfaces TypeScript (referencia de contratos)
- Cada componente tiene comentarios descriptivos
- Edge Functions tienen encabezados con descripción
- Schemas de validación son auto-documentados (Zod)

---

## 🎓 PARA UN INGENIERO QUE COMIENZA

### Si vas a construir desde CERO:

1. Lee **GUIA_INGENIERO_SENIOR.md** completa
2. Sigue el **Checklist de Implementación** (Fase 1 a Fase 18)
3. Usa el código existente como **referencia** (está completo y funcional)
4. Tiempo estimado: **12-13 semanas** (1 dev senior)

### Si vas a continuar ESTE proyecto:

1. Lee **README_PROYECTO.md** (este archivo)
2. Configura las variables de entorno
3. Configura Supabase (DB + Storage + Functions)
4. Ejecuta `npm install` y `npm run dev`
5. Revisa tareas pendientes según tus necesidades
6. El código está **100% funcional**, solo necesita configuración de servicios externos

---

## 🔑 CREDENCIALES DE PRUEBA

**IMPORTANTE:** Este proyecto usa un sistema de licencias. Para probar:

1. Crear una licencia en Supabase manualmente:
```sql
INSERT INTO access_keys (key, plan_type, active, max_devices)
VALUES ('TEST-LICENSE-001', 'elite', true, 1);
```

2. Al registrarte, usa el código `TEST-LICENSE-001`

3. El sistema vinculará tu `device_id` (user.id de Supabase Auth) con esa licencia

---

## 📞 SOPORTE Y CONTACTO

**Desarrollador original:** [Tu nombre/contacto]

**Stack principal:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Edge Functions)
- Mobile: Capacitor 6
- UI: Tailwind CSS + Framer Motion
- IA: Google Gemini + OpenAI (opcional)
- Pagos: MercadoPago

**Repositorio:** [Si aplica]

---

## 📊 MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~25,000 |
| Pantallas | 27 |
| Componentes | 26 |
| Utilidades | 9 |
| Edge Functions | 9 |
| Contextos globales | 4 |
| Tablas en DB | 10+ |
| Insignias disponibles | 25 |
| Objetivos diarios | 9 tipos |
| Niveles de XP | 15 |
| Planes disponibles | 3 (Basic, Pro, Elite) |

---

## ✨ CARACTERÍSTICAS ÚNICAS

1. **Sistema de gamificación robusto** - XP, niveles, objetivos, 25 badges
2. **Detección automática de fases vegetativas** - Regex + análisis temporal
3. **Árbol genealógico visual** - Hasta 5 generaciones
4. **IA integrada** - Chat, análisis de imágenes, generación de nombres
5. **Modo offline completo** - Service Worker + Background Sync
6. **Multi-plataforma nativo** - Web, Android, iOS con mismo código
7. **Multi-tenant seguro** - RLS de Supabase por licencia
8. **Event-driven architecture** - Desacoplado para escalabilidad

---

**Estado del proyecto:** ✅ **FUNCIONAL Y COMPLETO**

**Última actualización:** 2026-03-30
