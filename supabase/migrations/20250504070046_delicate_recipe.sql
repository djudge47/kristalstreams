/*
  # Footer Content Tables

  1. New Tables
    - `footer_links`
      - `id` (uuid, primary key)
      - `title` (text)
      - `url` (text)
      - `category` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `footer_social_links`
      - `id` (uuid, primary key)
      - `platform` (text)
      - `url` (text)
      - `icon` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for service role management
*/

-- Footer Links Table
CREATE TABLE IF NOT EXISTS footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to footer links"
  ON footer_links
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage footer links"
  ON footer_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Footer Social Links Table
CREATE TABLE IF NOT EXISTS footer_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE footer_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to footer social links"
  ON footer_social_links
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage footer social links"
  ON footer_social_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert initial footer links
INSERT INTO footer_links (title, url, category, "order") VALUES
 
  ('Pricing Plans', '/pricing', 'Quick Links', 2),
  ('Free Trial', '/free-trial', 'Quick Links', 3),
  ('Support', '/support', 'Quick Links', 4),
  ('Privacy Policy', '/privacy', 'Quick Links', 5),
  ('Help Center', '/support', 'Support', 1),
  ('Setup Guides', '/support/devices', 'Support', 2),
  ('Device Compatibility', '/support/devices', 'Support', 3),
  ('Speed Test', '/support/speed-test', 'Support', 4),
  ('Network Status', '/support/status', 'Support', 5);

-- Insert initial social links
INSERT INTO footer_social_links (platform, url, icon, "order") VALUES
  ('Facebook', 'https://facebook.com/kristalstreams', 'Facebook', 1),
  ('Twitter', 'https://twitter.com/kristalstreams', 'Twitter', 2),
  ('Instagram', 'https://instagram.com/kristalstreams', 'Instagram', 3),
  ('YouTube', 'https://youtube.com/kristalstreams', 'Youtube', 4);