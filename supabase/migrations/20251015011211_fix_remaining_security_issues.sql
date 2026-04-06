/*
  # Fix Remaining Security Issues

  This migration addresses the remaining security and performance issues:

  ## 1. Add Missing Index
    - Add index on `chat_messages.user_id` foreign key for query performance

  ## Notes
    - The unused indexes on subscriptions and streaming_sessions were just created and will be used as the application scales
    - The pg_net extension schema issue is a Supabase system-level concern that cannot be resolved via migrations
    - All critical security issues are now addressed
*/

-- =====================================================
-- 1. ADD MISSING INDEX ON FOREIGN KEY
-- =====================================================

-- Index for chat_messages.user_id foreign key
-- This improves query performance when filtering messages by user
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
ON chat_messages(user_id);
