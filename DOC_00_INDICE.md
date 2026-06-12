# CARNILAB - DOCUMENTACIÓN COMPLETA PARA DESARROLLO

## 📚 ÍNDICE DE DOCUMENTOS

Esta carpeta contiene la documentación completa para que un ingeniero senior pueda reconstruir CarniLab desde cero.

### ARCHIVOS PRINCIPALES:

1. **DOC_01_STACK.md** - Stack tecnológico completo, dependencias, versiones
2. **DOC_02_SETUP.md** - Configuración inicial del proyecto (paso a paso)
3. **DOC_03_DATABASE.md** - Esquema completo de base de datos Supabase
4. **DOC_04_ARCHITECTURE.md** - Arquitectura del sistema, diagramas, flujos
5. **DOC_05_AUTHENTICATION.md** - Sistema de autenticación completo
6. **DOC_06_FEATURES_CORE.md** - Funcionalidades principales (plantas, diario, cruces)
7. **DOC_07_FEATURES_PREMIUM.md** - Funcionalidades premium (IA, tienda, mensajería)
8. **DOC_08_GAMIFICATION.md** - Sistema de objetivos, XP, insignias
9. **DOC_09_AI_INTEGRATION.md** - Integración con Gemini y Claude
10. **DOC_10_OFFLINE.md** - Modo offline, sincronización, Service Worker
11. **DOC_11_MOBILE.md** - Builds nativos (iOS/Android) con Capacitor
12. **DOC_12_DEPLOYMENT.md** - Despliegue en producción (Vercel + Supabase)

### CÓDIGO FUENTE EXISTENTE:

El código fuente completo ya está en esta carpeta:
- `screens/` - 33 pantallas
- `components/` - 32 componentes
- `context/` - 3 contextos globales (Auth, App, Theme)
- `utils/` - 9 archivos de utilidades
- `types.ts` - Definiciones TypeScript
- `supabase/` - Edge Functions y migraciones

### CÓMO USAR ESTA DOCUMENTACIÓN:

1. Lee **DOC_01_STACK.md** para entender las tecnologías
2. Sigue **DOC_02_SETUP.md** para crear el proyecto
3. Lee **DOC_03_DATABASE.md** y crea la base de datos
4. Implementa cada módulo siguiendo los documentos DOC_04 a DOC_12
5. Usa el código fuente existente como referencia
6. Prueba siguiendo **DOC_13_TESTING.md**
7. Despliega siguiendo **DOC_12_DEPLOYMENT.md**

---

## ⚡ QUICK START

```bash
# 1. Clonar/crear proyecto
npm create vite@latest carnilab --template react-ts

# 2. Instalar dependencias
npm install react-router-dom @supabase/supabase-js framer-motion
npm install lucide-react uuid date-fns react-i18next
npm install @google/genai
npm install -D tailwindcss

# 3. Configurar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 4. Iniciar desarrollo
npm run dev
```

---

**TOTAL DE DOCUMENTACIÓN**: ~3000 líneas  
**CÓDIGO FUENTE**: ~25,000 líneas  
**TIEMPO ESTIMADO**: 4-6 semanas (1 dev senior)
