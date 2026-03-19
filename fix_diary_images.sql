-- Script para agregar soporte de múltiples imágenes en el diario
-- Ejecutar en el SQL Editor de Supabase

-- Agregar columna para múltiples imágenes (array de URLs)
ALTER TABLE diary ADD COLUMN IF NOT EXISTS imagenes TEXT[];

-- Migrar imágenes existentes al nuevo formato (opcional)
-- UPDATE diary SET imagenes = ARRAY[imagen] WHERE imagen IS NOT NULL AND imagenes IS NULL;
