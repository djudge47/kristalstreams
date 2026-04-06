/*
  # Create chat messages table for AI support

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_id` (text) - Groups messages in a conversation
      - `role` (text) - Either 'user' or 'assistant'
      - `content` (text) - The message content
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for authenticated users to read their own messages
    - Add policy for authenticated users to insert their own messages
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
