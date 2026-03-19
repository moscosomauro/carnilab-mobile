-- Add 'notified' column to alerts if it doesn't exist
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on pending notifications
CREATE INDEX IF NOT EXISTS idx_alerts_pending_notify ON alerts(notified, fecha, completada);
