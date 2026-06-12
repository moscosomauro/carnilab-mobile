-- =============================================
-- CROSS ANALYSES TABLE
-- Almacena análisis de IA sobre fotos de progenie
-- =============================================

-- Tabla principal de análisis
CREATE TABLE IF NOT EXISTS cross_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cross_id INTEGER NOT NULL,
    owner_key TEXT NOT NULL,

    -- Foto analizada
    image_url TEXT NOT NULL,
    image_type TEXT DEFAULT 'progeny', -- 'progeny' | 'mother' | 'father'

    -- Resultados del análisis de IA
    analysis_result JSONB NOT NULL DEFAULT '{}',
    -- Estructura esperada:
    -- {
    --   "coloration": { "dominant": "red", "percentage": 70, "description": "..." },
    --   "trap_size": { "category": "giant", "estimated_cm": 3.5 },
    --   "teeth_shape": { "type": "long", "description": "..." },
    --   "vigor": { "level": "high", "score": 8 },
    --   "anthocyanins": { "present": true, "intensity": "strong" },
    --   "growth_pattern": { "type": "upright", "description": "..." },
    --   "traits": ["Trampas gigantes", "Color rojo intenso", ...],
    --   "raw_analysis": "Texto completo del análisis de IA"
    -- }

    -- Metadatos
    confidence_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 a 1.00
    model_used TEXT DEFAULT 'claude-3-opus',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_cross_analyses_cross_id ON cross_analyses(cross_id);
CREATE INDEX idx_cross_analyses_owner ON cross_analyses(owner_key);
CREATE INDEX idx_cross_analyses_created ON cross_analyses(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE cross_analyses ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven sus propios análisis
CREATE POLICY "Users can view own analyses" ON cross_analyses
    FOR SELECT USING (owner_key = current_setting('request.jwt.claims', true)::json->>'license_key');

CREATE POLICY "Users can insert own analyses" ON cross_analyses
    FOR INSERT WITH CHECK (owner_key = current_setting('request.jwt.claims', true)::json->>'license_key');

CREATE POLICY "Users can update own analyses" ON cross_analyses
    FOR UPDATE USING (owner_key = current_setting('request.jwt.claims', true)::json->>'license_key');

CREATE POLICY "Users can delete own analyses" ON cross_analyses
    FOR DELETE USING (owner_key = current_setting('request.jwt.claims', true)::json->>'license_key');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cross_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cross_analyses_updated_at
    BEFORE UPDATE ON cross_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_cross_analyses_updated_at();

-- =============================================
-- PROGENY PHOTOS TABLE (fotos múltiples de progenie)
-- =============================================

CREATE TABLE IF NOT EXISTS cross_progeny_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cross_id INTEGER NOT NULL,
    owner_key TEXT NOT NULL,

    image_url TEXT NOT NULL,
    label TEXT, -- Etiqueta opcional (ej: "Planta #1", "Semana 4")
    notes TEXT,

    -- Referencia al análisis si existe
    analysis_id UUID REFERENCES cross_analyses(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progeny_photos_cross ON cross_progeny_photos(cross_id);
CREATE INDEX idx_progeny_photos_owner ON cross_progeny_photos(owner_key);

ALTER TABLE cross_progeny_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progeny photos" ON cross_progeny_photos
    FOR ALL USING (owner_key = current_setting('request.jwt.claims', true)::json->>'license_key');
