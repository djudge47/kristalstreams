/*
  # Create Channels Table for Kristal Streams

  1. New Tables
    - `channels`
      - `id` (bigserial, primary key)
      - `name` (text) - Channel name
      - `number` (integer) - Channel number
      - `category` (text) - Channel category (Sports, Movies, News, etc.)
      - `quality` (text) - Video quality (1080p, 4K, etc.)
      - `language` (text) - Channel language
      - `current_show` (text, optional) - Currently playing show
      - `next_show` (text, optional) - Next scheduled show
      - `current_show_time` (text, optional) - Current show time range
      - `next_show_time` (text, optional) - Next show time range
      - `stream_url` (text, optional) - Stream URL for the channel
      - `is_active` (boolean) - Whether channel is active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `channels` table
    - Add policy for all authenticated users to read channels
    - Add policy for authenticated users to read active channels only

  3. Indexes
    - Add index on channel number for fast lookups
    - Add index on category for filtering
*/

CREATE TABLE IF NOT EXISTS channels (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  number integer NOT NULL UNIQUE,
  category text NOT NULL,
  quality text DEFAULT '1080p',
  language text DEFAULT 'English',
  current_show text,
  next_show text,
  current_show_time text,
  next_show_time text,
  stream_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channels_number ON channels(number);
CREATE INDEX IF NOT EXISTS idx_channels_category ON channels(category);
CREATE INDEX IF NOT EXISTS idx_channels_active ON channels(is_active);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active channels"
  ON channels
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all channels"
  ON channels
  FOR SELECT
  TO authenticated
  USING (true);