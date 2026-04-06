/*
  # Create setup guides tables

  1. New Tables
    - `setup_guides`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `content` (text)
      - `device_type` (text)
      - `difficulty` (text)
      - `estimated_time` (integer)
      - `views` (integer)
      - `helpful_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `setup_guides` table
    - Add policy for public read access
    - Add policy for service role management
*/

CREATE TABLE IF NOT EXISTS setup_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  device_type text NOT NULL,
  difficulty text NOT NULL,
  estimated_time integer NOT NULL,
  views integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE setup_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to setup guides"
  ON setup_guides
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage setup guides"
  ON setup_guides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to increment views
CREATE OR REPLACE FUNCTION increment_guide_views(guide_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE setup_guides
  SET views = views + 1
  WHERE id = guide_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;