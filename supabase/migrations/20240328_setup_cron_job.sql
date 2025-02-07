
-- Enable the required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the function to run every 15 minutes
select
cron.schedule(
  'fetch-natural-disasters',
  '*/15 * * * *',
  $$
  select
    net.http_post(
        url:='https://pqxzzviqodstimvybgow.supabase.co/functions/v1/fetch-events',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeHp6dmlxb2RzdGltdnliZ293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NjY5NDgsImV4cCI6MjA1NDU0Mjk0OH0.YpbMsDZ4We5o6d9lqj0gBEIfB7iy3qZHA2nt74gTrcY"}'::jsonb
    ) as request_id;
  $$
);
