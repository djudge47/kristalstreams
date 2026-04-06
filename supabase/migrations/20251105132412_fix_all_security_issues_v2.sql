/*
  # Fix All Security Issues

  This migration addresses multiple security and performance issues identified by Supabase:

  ## 1. Add Missing Indexes on Foreign Keys
  - Add index on `chat_messages.user_id`
  - Add index on `streaming_sessions.user_id`
  - Add index on `subscriptions.user_id`
  - Add index on `support_tickets.user_id`

  ## 2. Optimize RLS Policies with Subqueries
  - Update all `profiles` table policies to use `(select auth.uid())` instead of `auth.uid()`
  - Update all `support_tickets` table policies to use `(select auth.uid())` instead of `auth.uid()`

  ## 3. Remove Duplicate Permissive Policies
  - Drop the duplicate "Users can select own profile" policy on `profiles` table
  - Keep only "Users can view own profile" policy

  ## 4. Fix pg_net Extension
  - Drop and recreate pg_net extension in extensions schema

  ## Security Notes
  - All indexes improve query performance when filtering by user_id
  - RLS policy optimization prevents re-evaluation of auth.uid() for each row
  - Removing duplicate policies simplifies security model
  - Moving extensions to dedicated schema follows security best practices
*/

-- 1. Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_user_id ON public.streaming_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);

-- 2. Drop and recreate profiles table RLS policies with optimized subqueries
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- 3. Drop and recreate support_tickets table RLS policies with optimized subqueries
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own tickets"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 4. Fix pg_net extension location
DO $$
BEGIN
  -- Create extensions schema if it doesn't exist
  CREATE SCHEMA IF NOT EXISTS extensions;
  
  -- Check if pg_net exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Drop from public and recreate in extensions schema
    DROP EXTENSION IF EXISTS pg_net CASCADE;
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) THEN
    -- Create in extensions schema if it doesn't exist anywhere
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  END IF;
END $$;