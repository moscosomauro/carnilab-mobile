-- Tabla para guardar backups de usuarios en la nube
CREATE TABLE IF NOT EXISTS user_backups (
    id SERIAL PRIMARY KEY,
    owner_key TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT 'Backup',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL,
    size_bytes INTEGER DEFAULT 0,
    version TEXT DEFAULT '2.0'
);

-- Índice para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_user_backups_owner ON user_backups(owner_key);

-- RLS: Solo el dueño puede ver/modificar sus backups
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
    ON user_backups FOR SELECT
    USING (owner_key = current_setting('request.jwt.claims', true)::json->>'sub'
           OR owner_key = current_setting('app.current_user_key', true));

CREATE POLICY "Users can insert own backups"
    ON user_backups FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete own backups"
    ON user_backups FOR DELETE
    USING (owner_key = current_setting('request.jwt.claims', true)::json->>'sub'
           OR owner_key = current_setting('app.current_user_key', true));

-- Limitar a máximo 10 backups por usuario (opcional, ejecutar manualmente)
-- DELETE FROM user_backups WHERE id NOT IN (
--     SELECT id FROM user_backups WHERE owner_key = 'USER_KEY' ORDER BY created_at DESC LIMIT 10
-- );
