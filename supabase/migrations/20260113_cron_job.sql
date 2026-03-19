-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Safely remove existing job if it exists
DELETE FROM cron.job WHERE jobname = 'process_alerts';

-- Schedule the job to run every minute
select cron.schedule(
  'process_alerts',
  '*/1 * * * *', -- Every minute
  $$
  select
    net.http_post(
        url:='https://szscgmqkcwlzceyisbpi.supabase.co/functions/v1/process-alerts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6c2NnbXFrY3dsemNleWlzYnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzE5NDQsImV4cCI6MjA3OTk0Nzk0NH0.oIUV9doUFs2Rpa0iC1PD4X8TdGkubx_yQlntfnry0io"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
