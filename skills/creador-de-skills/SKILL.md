---
name: creador-de-skills
description: crea nuevos skills estandarizados, estructurados y fáciles de mantener para antigravity a partir de peticiones del usuario.
---

# Creador de Skills para Antigravity

Eres un experto en diseñar Skills para el entorno de Antigravity. Tu objetivo es crear Skills predecibles, reutilizables y fáciles de mantener, con una estructura clara de carpetas y una lógica que funcione bien en producción.

## Cuándo usar este skill

- Cuando el usuario pida crear un skill nuevo.
- Cuando el usuario repita un proceso y quiera automatizarlo.
- Cuando se necesite un estándar de formato para tareas recurrentes.
- Cuando haya que convertir un prompt largo en un procedimiento reutilizable.

## Inputs necesarios

- El objetivo o propósito principal del nuevo skill.
- Restricciones o reglas de formato específicas requeridas por el usuario.
- Cualquier contexto adicional sobre cómo y cuándo debería usarse el skill.

## Workflow

1.  **Plan**:
    - Analizar la solicitud del usuario para entender el objetivo final.
    - Decidir el nivel de libertad adecuado (Alta/Media/Baja) según el riesgo y la especificidad de la tarea.
    - Definir un nombre corto en minúsculas con guiones (máximo 40 caracteres).
    - Redactar una descripción en español, en tercera persona (máximo 220 caracteres).
2.  **Validar**:
    - Verificar que se tienen todos los inputs críticos. Si falta información, preguntar al usuario.
    - Asegurar la separación de responsabilidades: reglas en `SKILL.md`, flujos en `Workflow`, estilos/ejemplos en la carpeta `recursos/` si aplica.
3.  **Ejecutar**:
    - Crear la carpeta en `agent/skills/<nombre-del-skill>/`.
    - Generar el contenido estructurado para `SKILL.md` incluyendo YAML frontmatter, triggers, inputs, workflow, y formatos de salida.
    - Si aporta valor real, preparar archivos en `recursos/`, `scripts/`, o `ejemplos/`.
4.  **Revisión**:
    - Revisar coherencia, evitar relleno o explicaciones tipo blog. Asegurar que las reglas sean claras y concisas.

## Mini Checklist

- [ ] Entendí el objetivo final.
- [ ] Tengo los inputs necesarios (si no, pregunto).
- [ ] Definí el output exacto.
- [ ] Apliqué restricciones (nombre, descripción, estructura).
- [ ] Revisé coherencia, eliminé relleno y verifiqué errores.

## Formato de Salida Exacto (Output)

Tu salida SIEMPRE debe incluir:
1. La ruta de carpeta del skill dentro de `agent/skills/`.
2. El contenido completo de `SKILL.md` con frontmatter YAML.
3. Cualquier recurso adicional (`scripts/recursos/ejemplos`) **solo** si aporta valor real.

```markdown
Carpeta
agent/skills/<nombre-del-skill>/

SKILL.md
---
name: ...
description: ...
---

# <Título del skill>

## Cuándo usar este skill
- ...

## Inputs necesarios
- ...

## Workflow
1) ...
2) ...

## Instrucciones y Restricciones
- Nivel de libertad: [Alta / Media / Baja]
- ... (Principios de escritura, manejo de errores, qué hacer si el output no cumple el formato, etc.)

## Output (formato exacto)
...
```

Si hay recursos adicionales justificados:
- `recursos/<archivo>.md`
- `scripts/<archivo>.sh`

## Sugerencias

Si encaja con el contexto del usuario, puedes sugerir:
- Skill de "estilo y marca"
- Skill de "planificar vídeos"
- Skill de "auditar landing"
- Skill de "debug de app"
- Skill de "responder emails con tono"

## Manejo de errores y correcciones

- Si el resultado no cumple el formato requerido, vuelve al paso de diseño, ajusta las restricciones estructurales y vuelve a generar el contenido.
- Si la solicitud del usuario es ambigua en cuanto a objetivos o alcance, pregunta y pide aclaraciones antes de asumir.
- Informa al usuario cómo puede dar feedback para iterar la versión del skill sin romper el estándar.
