# 📖 Guía de la Nueva Bitácora de Cultivo

## 🎯 Descripción General

La nueva **Vista de Bitácora** transforma el Diario de Cultivo de una simple lista cronológica a una **verdadera bitácora narrativa** que te permite seguir la historia completa de cada planta desde el día 1.

---

## ✨ Características Principales

### 1. **Agrupación por Planta con Accordion**
- Las entradas se agrupan automáticamente por planta
- Cada planta tiene su propia tarjeta desplegable
- Click para expandir/colapsar la bitácora completa

### 2. **Panel de Estadísticas Inteligente**
Cada planta muestra:
- 🌱 **Fase de crecimiento automática** (Germinación, Plántula, Vegetativa, Pre-floración, Floración, Maduración)
- 📅 **Días desde siembra** (calculado automáticamente)
- 📏 **Crecimiento en altura** (inicio → actual con diferencia)
- 🍃 **Crecimiento en hojas** (inicio → actual con diferencia)
- 📊 **Registro de actividades** (riegos, fertilizaciones, podas, observaciones)
- ⏰ **Última actividad** (hace X días)

### 3. **Galería de Evolución Fotográfica**
- 📸 Carrusel horizontal con todas las fotos
- 🔍 Click en foto para ver ampliada
- 📊 **Comparativa automática**: Primera foto vs Última foto
- ➡️ Navegación con flechas

### 4. **Timeline Cronológico Ascendente**
- 📖 Historia desde el **Día 1** hasta el presente
- 🎯 Cada entrada muestra su "Día relativo" (Día 1, Día 5, Día 30, etc.)
- 🎨 Iconos de colores por tipo de actividad
- 📝 Descripción, métricas e imágenes por entrada
- ✏️ Editar/Borrar desde la bitácora

---

## 🎨 Cálculo Automático de Fases

La fase de crecimiento se determina inteligentemente por:

### 1. **Detección por Keywords en Descripciones**
Si tus notas mencionan palabras clave, el sistema detecta la fase:
- "flor", "floración", "pistilos" → **Floración**
- "pre-flor", "preflora" → **Pre-floración**
- "cosecha", "maduración" → **Maduración**

### 2. **Cálculo por Días (Cannabis/Plantas comunes)**
Si no hay keywords, usa días desde siembra:
- 0-7 días → 🌱 **Germinación**
- 7-21 días → 🌿 **Plántula**
- 21-60 días → 🍃 **Vegetativa**
- 60-90 días → 🌸 **Pre-floración**
- 90-150 días → 🌺 **Floración**
- 150+ días → 🍇 **Maduración**

### Colores de Fase
```
Germinación:   #8B4513 (Marrón tierra)
Plántula:      #22C55E (Verde claro)
Vegetativa:    #10B981 (Verde vibrante)
Pre-floración: #F59E0B (Ámbar)
Floración:     #EC4899 (Rosa)
Maduración:    #8B5CF6 (Púrpura)
```

---

## 🚀 Cómo Usar

### Acceder a la Vista de Bitácora
1. Ir a **Diario** desde la navegación
2. Verás 3 iconos de vista en la parte superior:
   - 📖 **Bitácora** (nuevo - por defecto)
   - 📋 **Lista** (vista anterior)
   - 📅 **Calendario** (vista existente)
3. Click en 📖 para ver la bitácora

### Expandir/Colapsar Plantas
- Click en cualquier tarjeta de planta para expandir/colapsar
- Si tienes solo 1 planta, se abre automáticamente

### Ver Fotos Ampliadas
- Click en cualquier foto del carrusel
- Click afuera para cerrar

### Editar/Borrar Entradas
- Hover sobre una entrada en el timeline
- Aparecen botones "EDITAR" y "BORRAR"
- Funciona igual que antes

---

## 📊 Ejemplo Visual de Cómo Se Ve

```
┌────────────────────────────────────────────┐
│  🌿  Rosa del Desierto #23          ▼     │
│      12 entradas • Última: Hace 2 días    │
│      45 días • Fase: Vegetativa           │
└────────────────────────────────────────────┘
         ↓ (Click para expandir)
┌────────────────────────────────────────────┐
│  🌿  Rosa del Desierto #23          ▲     │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ 🍃 Fase: Vegetativa | 45 días vida  │ │
│  │ 📏 Altura: 12cm → 23cm (+11cm)      │ │
│  │ 🍃 Hojas: 6 → 18 (+12)              │ │
│  │ 💧 5 Riegos | 🌱 3 Fertiliz.        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  📸 Galería de Evolución (8 fotos)        │
│  [foto] [foto] [foto] [foto] [foto] →     │
│                                            │
│  📖 Bitácora Cronológica                  │
│  ├─ Día 1 - 15 Dic 2024                  │
│  │  💧 Primer riego post-siembra          │
│  │  "Sustrato con perlita"                │
│  │                                        │
│  ├─ Día 5 - 20 Dic 2024                  │
│  │  👁️ Primera hoja verdadera            │
│  │  📏 2cm | 🍃 2 hojas                  │
│  │  [Foto macro]                          │
│  │                                        │
│  ├─ Día 15 - 30 Dic 2024                 │
│  │  🌱 Trasplante a maceta 5"            │
│  │  [Foto de raíces]                      │
│  └─ ...                                   │
└────────────────────────────────────────────┘
```

---

## 🔧 Filtros y Búsqueda

### Compatibilidad Total
La nueva vista respeta **todos los filtros existentes**:
- ✅ Búsqueda por texto
- ✅ Filtro por planta específica
- ✅ Filtro por tipo de actividad

### Comportamiento
- Si filtras por **una planta específica**, solo esa planta aparece
- Si filtras por **tipo de actividad**, solo se muestran entradas de ese tipo
- Si buscas texto, solo aparecen plantas/entradas que coincidan

---

## 🎯 Casos de Uso

### 1. Seguimiento de Crecimiento
```
Problema: "¿Cuánto ha crecido mi planta?"
Solución: Panel de stats muestra:
  - Altura inicial vs actual
  - Días desde siembra
  - Fase de crecimiento
```

### 2. Revisión Fotográfica
```
Problema: "Quiero ver la evolución visual"
Solución: Galería con:
  - Todas las fotos en carrusel
  - Comparativa primera vs última
  - Vista ampliada con 1 click
```

### 3. Historia Cronológica
```
Problema: "¿Qué pasó en cada etapa?"
Solución: Timeline ascendente:
  - Día 1 → Hoy
  - Eventos ordenados
  - Contexto completo
```

### 4. Análisis Multi-Planta
```
Problema: "Comparar progreso de varias plantas"
Solución: Vista de acordeón:
  - Todas las plantas en una pantalla
  - Expandir solo las que te interesan
  - Stats comparables de un vistazo
```

---

## 📝 Tips para Aprovechar al Máximo

### 1. **Usa Descripciones Descriptivas**
En lugar de:
```
"Riego"
```

Mejor:
```
"Riego profundo después de 3 días sin agua.
Sustrato estaba seco. Planta respondió bien."
```

Esto ayuda a:
- Mejor detección de fase
- Historia más rica
- Contexto para el futuro

### 2. **Registra Métricas Regularmente**
- Altura cada 7 días
- Conteo de hojas en cada etapa
- Fotos semanales

Resultado:
- Gráficas más precisas
- Mejor tracking de crecimiento
- Galería evolutiva completa

### 3. **Toma Fotos Consistentes**
- Mismo ángulo
- Misma iluminación
- Objeto de referencia (moneda, regla)

Resultado:
- Comparativa visual clara
- Fácil ver progreso real

### 4. **Usa Keywords en Notas**
Menciona explícitamente:
- "Primera flor"
- "Inicio de floración"
- "Cosecha"

Resultado:
- Detección automática de fase
- Badge correcto de fase

---

## 🛠️ Componentes Técnicos

### Archivos Creados
```
utils/diaryHelpers.ts           - Cálculos y agrupación
components/diary/
  ├─ PlantJournalCard.tsx       - Tarjeta principal con accordion
  ├─ PlantStatsPanel.tsx         - Panel de estadísticas
  ├─ PhotoGallery.tsx            - Galería con carrusel
  └─ TimelineAscending.tsx       - Timeline cronológico
```

### Funciones Principales
```typescript
// Agrupa entradas por planta con estadísticas
groupEntriesByPlant(entries: DiaryEntry[]): PlantJournalGroup[]

// Calcula estadísticas de una planta
calculatePlantStats(plantName: string, entries: DiaryEntry[]): PlantJournalStats

// Determina fase de crecimiento
calculateGrowthPhase(days: number, entries: DiaryEntry[]): GrowthPhase

// Calcula día relativo desde primera entrada
calculateRelativeDay(entryDate: string, firstDate: string): number
```

---

## 🎨 Personalización

### Colores de Fase
Edita en `utils/diaryHelpers.ts`:
```typescript
export const getPhaseColor = (phase: GrowthPhase): string => {
  const colors: Record<GrowthPhase, string> = {
    'Germinación': '#8B4513',  // Cambia aquí
    // ...
  };
  return colors[phase];
};
```

### Emojis de Fase
```typescript
export const getPhaseEmoji = (phase: GrowthPhase): string => {
  const emojis: Record<GrowthPhase, string> = {
    'Germinación': '🌱',  // Cambia aquí
    // ...
  };
  return emojis[phase];
};
```

### Umbrales de Días
Edita la lógica en `calculateGrowthPhase()`:
```typescript
if (daysSinceSeed < 7) return 'Germinación';
if (daysSinceSeed < 21) return 'Plántula';  // Cambia estos números
// ...
```

---

## 🐛 Troubleshooting

### Problema: "No aparece ninguna planta"
**Causa**: No hay entradas en el diario
**Solución**: Crea al menos 1 entrada desde el botón "+"

### Problema: "Fase incorrecta"
**Causa**: Cálculo automático no detecta tu caso específico
**Solución**: Añade keywords en tus descripciones ("floración", etc.)

### Problema: "Fotos no se ven"
**Causa**: Entradas sin imágenes
**Solución**: Añade fotos al crear/editar entradas

### Problema: "Días incorrectos"
**Causa**: Primera entrada no es el "día 1" real
**Solución**: Edita la fecha de la primera entrada a la fecha real de siembra

---

## 🚀 Próximas Mejoras Posibles

### Ideas para el Futuro
1. **Exportar Bitácora a PDF**
   - Generar informe completo con fotos
   - Perfecto para documentación

2. **Comparativa Multi-Planta**
   - Vista lado a lado de 2 plantas
   - Gráficas comparativas

3. **Alertas Inteligentes**
   - "Han pasado 5 días sin regar"
   - "Hora de fertilizar según calendario"

4. **Timeline Inverso**
   - Opción para ver desde hoy → día 1
   - Toggle entre ambos modos

5. **Tags Personalizados**
   - Etiquetas custom por entrada
   - Filtrar por tags

---

## 📚 Referencias

- **Código fuente**: `screens/Diary.tsx` (líneas ~1-600)
- **Helpers**: `utils/diaryHelpers.ts`
- **Componentes**: `components/diary/*`
- **Fase 2 Docs**: `FASE_2_MEJORAS_TECNICAS.md`

---

**🎉 ¡Disfruta tu nueva bitácora de cultivo!**

Ahora tienes una herramienta profesional para documentar y seguir el progreso completo de cada planta, con una narrativa visual que cuenta la historia de tu jardín.
