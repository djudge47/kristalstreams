/*
  # Restore pg_net to public schema

  1. Issue
    - Moving pg_net to extensions schema may have broken functionality
    - Reverting to keep pg_net in public schema for compatibility

  2. Changes
    - Drop pg_net from extensions schema
    - Recreate pg_net in public schema
*/

-- Drop pg_net from extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Recreate pg_net in public schema for compatibility
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;
