/*
  # Create Setup Guides Table

  1. New Tables
    - `setup_guides`
      - `id` (uuid, primary key)
      - `title` (text) - Guide title
      - `slug` (text, unique) - URL-friendly identifier
      - `device_type` (text) - Device category (Smart TV, Mobile, etc.)
      - `content` (text) - Detailed setup instructions
      - `difficulty` (text) - Easy, Medium, or Hard
      - `estimated_time` (integer) - Minutes to complete
      - `views` (integer) - View counter
      - `helpful_count` (integer) - Helpful votes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `setup_guides` table
    - Add policy for public read access (no auth required)
    - Add policy for authenticated users to increment views/helpful count
*/

CREATE TABLE IF NOT EXISTS setup_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  device_type text NOT NULL,
  content text NOT NULL,
  difficulty text DEFAULT 'Easy',
  estimated_time integer DEFAULT 10,
  views integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE setup_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read setup guides"
  ON setup_guides
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can increment views"
  ON setup_guides
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_setup_guides_device_type ON setup_guides(device_type);
CREATE INDEX IF NOT EXISTS idx_setup_guides_slug ON setup_guides(slug);