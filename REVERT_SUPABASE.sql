-- Revert the pg_net changes that may have broken things
-- This restores the original state

DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
