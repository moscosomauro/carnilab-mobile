# 🗺️ CarniLab - Roadmap Integrado 2025-2026
> **Visión**: Convertir CarniLab en el ecosistema digital definitivo para cultivadores, integrando gestión, comunidad y tecnología avanzada (IoT/AI).

---

## 🧭 Diagnóstico del Estado Actual (Enero 2026)

### ✅ Fortalezas (Lo que ya tenemos)
- **Core Sólido**: Gestión completa de plantas, cruzas y diario de cultivo.
- **UX/UI Premium**: Diseño "Midnight Lab" con alta fidelidad visual (particularmente en `PublicGallery` y `DiscoveryPrototype`).
- **Innovación Visual**: Mapas interactivos ("Red Global") y visualización de linajes.
- **Base Técnica**: React + Vite + Supabase (potente y escalable).
- **Híbrido Web/Desktop**: Soporte para PWA y Electron.

### 🚧 Deuda Técnica & Riesgos
- **Testing Inexistente**: No hay `vitest` ni infraestructura de pruebas. Riesgo alto de regresiones.
- **Validaciones**: Si bien `zod` está instalado, falta su implementación sistemática en formularios críticos.
- **Seguridad**: RLS (Row Level Security) en Supabase requiere auditoría y activación completa.
- **Performance**: Listas grandes (Plantas/Cruzas) no tienen virtualización (`react-window`).

---

## 🚀 Roadmap Estratégico Integrado

Este roadmap se divide en tres pilares simultáneos: **Cimientos** (Estabilidad), **Expansión** (Comunidad) e **Innovación** (Tecnología Deep Tech).

### FASE 1: CIMIENTOS DE TITANIO (Q1 2026)
*Objetivo: Estabilidad, Seguridad y Preparación para Escalar*

#### 1.1 Infraestructura de Calidad (Testing & CI)
- [ ] **Setup Vitest + React Testing Library**: Configurar entorno de pruebas unitarias.
- [ ] **Tests Críticos**: Crear tests para `GeneticCalculator`, `GeminiHelpers` y flujos de autenticación.
- [ ] **End-to-End Testing**: Implementar Playwright para flujos críticos (Login -> Crear Planta -> Guardar).

#### 1.2 Seguridad y Validaciones
- [ ] **Zod Schemas**: Estandarizar validación en todos los inputs (`AddPlant`, `Profile`, `Climate`).
- [ ] **Supabase RLS**: Activar y probar políticas de seguridad estricta para asegurar privacidad de datos.

#### 1.3 Performance UI
- [ ] **Virtualización**: Implementar `react-window` en `PlantList` y `CrossesScreen` para soportar miles de items sin lag.
- [ ] **Optimización de Imágenes**: Mejorar el pipeline de compresión antes de subir a Storage.

---

### FASE 2: ECOSISTEMA Y COMUNIDAD (Q2 2026)
*Objetivo: Retención y Efecto de Red (Network Effects)*

#### 2.1 CarniLab Social (Ampliando `DiscoveryPrototype`)
- [ ] **Feed de Actividad**: Ver actualizaciones de viveros seguidos (nuevas plantas, hitos).
- [ ] **Sistema de Interacciones**: "Polinizar" (Like), Comentarios en Bitácoras públicas.
- [ ] **Trading Hall**: Módulo de subastas o intercambios seguros entre cultivadores verificados.

#### 2.2 Mensajería Avanzada
- [ ] **Chat en Tiempo Real**: Mejorar el sistema actual con indicadores de "escribiendo...", confirmación de lectura y soporte para imágenes/audio.
- [ ] **Notificaciones Push Reales**: Implementar Web Push Notifications para mensajes y alertas de cultivo.

#### 2.3 Gamificación
- [ ] **Badges Dinámicos**: Logros automáticos (ej: "Genetista Experto" tras 50 cruzas).
- [ ] **Leaderboards**: Rankings globales y por país (basado en `DiscoveryPrototype`).

---

### FASE 3: INNOVACIÓN DEEP TECH (Q3 2026 - Adelante)
*Objetivo: Diferenciación Tecnológica Absoluta*

#### 3.1 CarniLab IoT (El "Cerebro" del Invernadero)
*Integración real para `ClimateScreen`*
- [ ] **Soporte ESP32/Arduino**: Protocolo MQTT para recibir datos de sensores.
- [ ] **Alertas Ambientales**: Notificar automáticamante si T° > 35°C o Humedad < 40%.
- [ ] **Control Activo**: (Futuro) Activar riego/luces desde la app.

#### 3.2 AI en el Borde (Edge AI)
- [ ] **Doctor de Plagas Offline**: Implementar modelo TensorFlow.js para detectar pulgones/hongos usando la cámara del dispositivo, sin internet.
- [ ] **Predicción de Fenotipos V2**: Entrenar modelo propio con los datos de cruzas reales generados por los usuarios.

#### 3.3 Mobile Native
- [ ] **React Native / Capacitor**: Migrar de PWA a app nativa real para acceso profundo al hardware (Bluetooth para IoT, Notificaciones en segundo plano, Cámara avanzada).

---

## 💡 Resumen de Valor
Al completar este roadmap, CarniLab dejará de ser una "herramienta de gestión" para convertirse en una **plataforma indispensable** que conecta el mundo físico (IoT), la inteligencia biológica (AI) y la comunidad global de cultivadores.
