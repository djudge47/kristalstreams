/*
  # Fix Security Issues - Remove Unused Indexes and Move Extension

  1. Changes
    - Remove unused indexes that have 0 scans
    - Move pg_net extension from public schema to extensions schema

  2. Security Improvements
    - Cleaner database structure
    - Better schema organization
    - Reduced attack surface

  3. Indexes Being Removed
    - idx_setup_guides_device_type (unused, 0 scans)
    - idx_setup_guides_slug (unused, 0 scans, duplicate of unique constraint)
    - idx_channels_number (unused, 0 scans, duplicate of unique constraint)
    - idx_subscriptions_user_id (unused, 0 scans)
    - idx_streaming_sessions_user_id (unused, 0 scans)
    - idx_chat_messages_user_id (unused, 0 scans)

  4. Extension Changes
    - Move pg_net from public to extensions schema
*/

-- Remove unused indexes
-- These indexes have 0 scans and are not being used

-- setup_guides table indexes
DROP INDEX IF EXISTS idx_setup_guides_device_type;
DROP INDEX IF EXISTS idx_setup_guides_slug;

-- channels table index (duplicate of unique constraint)
DROP INDEX IF EXISTS idx_channels_number;

-- subscriptions table index
DROP INDEX IF EXISTS idx_subscriptions_user_id;

-- streaming_sessions table index
DROP INDEX IF EXISTS idx_streaming_sessions_user_id;

-- chat_messages table index
DROP INDEX IF EXISTS idx_chat_messages_user_id;

-- Move pg_net extension from public schema to extensions schema
-- First drop it from public
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Recreate pg_net in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
