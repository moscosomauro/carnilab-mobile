# 🔐 Configuración de Variables de Entorno - CarniLab

Este documento explica cómo configurar correctamente las variables de entorno para ejecutar CarniLab de forma segura.

---

## 📋 Resumen

CarniLab utiliza variables de entorno para almacenar credenciales sensibles como:
- Credenciales de Supabase (URL + ANON_KEY)
- API Key de Google Gemini
- Contraseña de administrador

**⚠️ NUNCA commitees el archivo `.env` a Git. Solo commitea `.env.example`.**

---

## 🚀 Configuración Rápida

### 1. Copia el archivo de ejemplo

```bash
cp .env.example .env
```

### 2. Edita `.env` con tus credenciales reales

Abre el archivo `.env` y completa con tus valores:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Google Gemini AI
VITE_GEMINI_API_KEY=tu-gemini-api-key

# Admin Access
VITE_ADMIN_PASSWORD=tu-password-admin-seguro

# Environment
VITE_APP_ENV=development
```

### 3. Verifica que `.env` esté en `.gitignore`

El archivo `.gitignore` ya incluye `.env` para proteger tus credenciales:

```
# Environment Variables (CRÍTICO - No commitear credenciales)
.env
.env.local
.env.production
.env.*.local
```

---

## 🔑 Obtener Credenciales

### Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Clic en **Settings** → **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Google Gemini AI

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Clic en **Get API Key**
3. Copia la clave → `VITE_GEMINI_API_KEY`

### Admin Password

Elige una contraseña segura para acceso administrativo:

```env
VITE_ADMIN_PASSWORD=MiPasswordSeguro2026!
```

---

## 🏗️ Uso en Diferentes Entornos

### Desarrollo Local

```env
VITE_APP_ENV=development
```

En desarrollo, todos los logs están habilitados.

### Producción (Web)

```env
VITE_APP_ENV=production
```

En producción, solo se muestran errores críticos en consola.

### Electron (Desktop)

Para compilar la app de escritorio:

```bash
npm run electron:build
```

Las variables de entorno se empaquetan automáticamente en el build.

---

## 🧪 Verificar Configuración

Puedes verificar que las variables estén cargadas correctamente ejecutando:

```bash
npm run dev
```

Si ves errores como:

```
❌ GEMINI_API_KEY no configurado. Verifica tu archivo .env
```

Significa que falta configurar esa variable en tu archivo `.env`.

---

## 🔒 Seguridad

### ✅ HACER

- ✅ Usar `.env.example` como template
- ✅ Mantener `.env` en `.gitignore`
- ✅ Rotar las API keys periódicamente
- ✅ Usar contraseñas diferentes en desarrollo y producción
- ✅ Restringir el acceso a las API keys en Google Cloud Console

### ❌ NO HACER

- ❌ Commitear `.env` a Git
- ❌ Compartir tus credenciales en Slack/Discord
- ❌ Hardcodear credenciales en el código fuente
- ❌ Usar credenciales de producción en desarrollo

---

## 🐛 Troubleshooting

### Error: "Cannot read VITE_SUPABASE_URL"

**Solución**: Asegúrate de que:
1. El archivo `.env` existe en la raíz del proyecto
2. Las variables empiezan con `VITE_` (requerido por Vite)
3. Reiniciaste el servidor de desarrollo después de crear `.env`

### Error: "Failed to fetch from Supabase"

**Solución**: Verifica que:
1. `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` sean correctos
2. Tu proyecto de Supabase esté activo
3. Las políticas RLS estén configuradas correctamente

### Error: "Gemini API Rate Limit"

**Solución**:
1. Verifica tu cuota en [Google AI Studio](https://aistudio.google.com/apikey)
2. Solicita incremento de cuota si es necesario
3. Implementa rate limiting en tu app

---

## 📚 Referencias

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase API Keys](https://supabase.com/docs/guides/api)
- [Google Gemini API](https://ai.google.dev/docs)

---

## 🆘 Soporte

Si tienes problemas con la configuración de variables de entorno:

1. Revisa este documento
2. Verifica que el archivo `.env` existe y tiene el formato correcto
3. Consulta los logs de desarrollo para ver el error específico

---

**Última actualización**: 2026-01-14
