/*
  # Setup Automatic EPG Updates with pg_cron

  1. Changes
    - Enable pg_cron extension for scheduled tasks
    - Enable pg_net extension for HTTP requests
    - Create a function to trigger EPG updates via edge function
    - Schedule the function to run daily at midnight (00:00)

  2. Notes
    - The scheduled job will automatically update all channel EPG data every 24 hours
    - Runs at midnight (00:00) server time
    - Uses Supabase edge function for the update logic
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION trigger_epg_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  supabase_url text;
  service_key text;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_key := current_setting('app.service_role_key', true);

  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Supabase configuration not set. Skipping EPG update.';
    RETURN;
  END IF;

  SELECT INTO request_id
    net.http_post(
      url := supabase_url || '/functions/v1/update-channel-epg',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb
    );
END;
$$;

SELECT cron.schedule(
  'update-channel-epg-daily',
  '0 0 * * *',
  'SELECT trigger_epg_update();'
);