/**
 * CARNILAB - VALIDATION SCHEMAS
 * Esquemas Zod para validación de datos robusta
 * Fecha: 2026-01-14
 */

import { z } from 'zod';

// ============================================
// PLANT VALIDATION SCHEMA
// ============================================

export const PlantSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  especie: z
    .string()
    .min(1, 'La especie es requerida')
    .max(100, 'La especie no puede exceder 100 caracteres')
    .trim(),

  fecha_adquisicion: z
    .string()
    .optional()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Fecha inválida'
    ),

  origen: z
    .string()
    .max(200, 'El origen no puede exceder 200 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  precio: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(1000000, 'El precio no puede exceder 1,000,000')
    .optional()
    .nullable(),

  estado: z
    .enum(['saludable', 'regular', 'critico'], {
      message: 'Estado inválido. Debe ser: saludable, regular o crítico',
    })
    .default('saludable'),

  ubicacion: z
    .string()
    .max(200, 'La ubicación no puede exceder 200 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  notas: z
    .string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  en_venta: z
    .boolean()
    .default(false),

  precio_venta: z
    .number()
    .min(0, 'El precio de venta no puede ser negativo')
    .max(1000000, 'El precio de venta no puede exceder 1,000,000')
    .optional()
    .nullable(),

  // Detalles de cultivo (rediseño 2026)
  iluminacion: z.string().max(100).trim().optional().or(z.literal('')),
  humedad: z.string().max(100).trim().optional().or(z.literal('')),
  sustrato: z.string().max(100).trim().optional().or(z.literal('')),
  tamano_maceta: z.string().max(50).trim().optional().or(z.literal('')),
  etiquetas: z.array(z.string().max(40).trim()).max(20).optional(),
  en_floracion: z.boolean().optional(),
  fecha_floracion: z.string().optional().or(z.literal('')),
});

export type PlantInput = z.infer<typeof PlantSchema>;

// ============================================
// CROSS VALIDATION SCHEMA
// ============================================

export const CrossSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la cruza es requerido')
    .max(150, 'El nombre no puede exceder 150 caracteres')
    .trim(),

  madre_nombre: z
    .string()
    .min(1, 'El nombre de la madre es requerido')
    .max(100, 'El nombre de la madre no puede exceder 100 caracteres')
    .trim(),

  madre_especie: z
    .string()
    .min(1, 'La especie de la madre es requerida')
    .max(100, 'La especie de la madre no puede exceder 100 caracteres')
    .trim(),

  padre_nombre: z
    .string()
    .min(1, 'El nombre del padre es requerido')
    .max(100, 'El nombre del padre no puede exceder 100 caracteres')
    .trim(),

  padre_especie: z
    .string()
    .min(1, 'La especie del padre es requerida')
    .max(100, 'La especie del padre no puede exceder 100 caracteres')
    .trim(),

  padres_extra: z
    .array(
      z.object({
        nombre: z.string().min(1).max(100),
        especie: z.string().min(1).max(100),
      })
    )
    .max(5, 'No puedes agregar más de 5 padres adicionales')
    .optional(),

  fecha_cruza: z
    .string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Fecha de cruza inválida'
    ),

  fecha_germinacion: z
    .string()
    .optional()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Fecha de germinación inválida'
    ),

  semillas_obtenidas: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(10000, 'No puede exceder 10,000')
    .optional()
    .nullable(),

  plantas_germinadas: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(10000, 'No puede exceder 10,000')
    .optional()
    .nullable(),

  estado: z
    .enum(['en_proceso', 'completada', 'fallida'], {
      message: 'Estado inválido',
    })
    .default('en_proceso'),

  objetivo: z.string().max(100).trim().optional().or(z.literal('')),

  notas: z
    .string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type CrossInput = z.infer<typeof CrossSchema>;

// ============================================
// DIARY ENTRY VALIDATION SCHEMA
// ============================================

export const DiaryEntrySchema = z.object({
  planta_nombre: z
    .string()
    .min(1, 'El nombre de la planta es requerido')
    .max(100)
    .trim(),

  planta_especie: z
    .string()
    .min(1, 'La especie es requerida')
    .max(100)
    .trim(),

  fecha: z
    .string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Fecha inválida'
    ),

  tipo: z
    .enum(['riego', 'fertilizacion', 'poda', 'observacion'], {
      message: 'Tipo inválido',
    }),

  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim(),

  altura: z
    .number()
    .min(0, 'La altura no puede ser negativa')
    .max(500, 'La altura no puede exceder 500 cm')
    .optional()
    .nullable(),

  hojas: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'El número de hojas no puede ser negativo')
    .max(1000, 'El número de hojas no puede exceder 1000')
    .optional()
    .nullable(),
});

export type DiaryEntryInput = z.infer<typeof DiaryEntrySchema>;

// ============================================
// ALERT VALIDATION SCHEMA
// ============================================

export const AlertSchema = z.object({
  tipo: z
    .string()
    .min(1, 'El tipo es requerido')
    .max(50)
    .trim(),

  planta: z
    .string()
    .max(100)
    .trim()
    .optional()
    .or(z.literal('')),

  mensaje: z
    .string()
    .min(1, 'El mensaje es requerido')
    .max(500, 'El mensaje no puede exceder 500 caracteres')
    .trim(),

  prioridad: z
    .enum(['alta', 'media', 'baja'], {
      message: 'Prioridad inválida',
    })
    .default('media'),

  fecha: z
    .string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Fecha inválida'
    ),

  completada: z
    .boolean()
    .default(false),
});

export type AlertInput = z.infer<typeof AlertSchema>;

// ============================================
// CLIMATE LOG VALIDATION SCHEMA
// ============================================

export const ClimateLogSchema = z.object({
  date: z
    .string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Fecha inválida'
    ),

  temp_max: z
    .number()
    .min(-50, 'Temperatura muy baja')
    .max(70, 'Temperatura muy alta'),

  temp_min: z
    .number()
    .min(-50, 'Temperatura muy baja')
    .max(70, 'Temperatura muy alta'),

  humidity: z
    .number()
    .min(0, 'Humedad no puede ser negativa')
    .max(100, 'Humedad no puede exceder 100%'),

  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type ClimateLogInput = z.infer<typeof ClimateLogSchema>;

// ============================================
// SHOP PRODUCT VALIDATION SCHEMA
// ============================================

export const ShopProductSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(150, 'El título no puede exceder 150 caracteres')
    .trim(),

  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .trim(),

  price: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(1000000, 'El precio no puede exceder 1,000,000'),

  stock: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(10000, 'El stock no puede exceder 10,000'),

  category: z
    .enum(['plant', 'supply', 'merch'], {
      message: 'Categoría inválida',
    })
    .default('plant'),

  active: z
    .boolean()
    .default(true),
});

export type ShopProductInput = z.infer<typeof ShopProductSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Valida datos y retorna resultado con mensajes de error amigables
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const zodError = result.error as any;
  const errors = zodError.errors.map((err: any) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });

  return { success: false, errors };
};

/**
 * Valida y lanza error si falla (útil para funciones async)
 */
export const validateOrThrow = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T => {
  return schema.parse(data);
};
