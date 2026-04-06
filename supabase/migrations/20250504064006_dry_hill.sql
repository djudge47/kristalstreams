/*
  # Support System Schema

  1. New Tables
    - `support_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text)
      - `description` (text)
      - `icon` (text)
      - `order` (int)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `support_articles`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references support_categories)
      - `title` (text)
      - `slug` (text)
      - `content` (text)
      - `is_featured` (boolean)
      - `views` (int)
      - `helpful_count` (int)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create support_categories table
CREATE TABLE support_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create support_articles table
CREATE TABLE support_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES support_categories ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  is_featured boolean DEFAULT false,
  views int DEFAULT 0,
  helpful_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for support_categories
CREATE POLICY "Allow public read access to support categories"
  ON support_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage support categories"
  ON support_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for support_articles
CREATE POLICY "Allow public read access to support articles"
  ON support_articles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage support articles"
  ON support_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert initial support categories
INSERT INTO support_categories (name, slug, description, icon, "order") VALUES
('Getting Started', 'getting-started', 'Learn the basics of using our streaming service', 'book-open', 1),
('Account & Billing', 'billing', 'Manage your subscription and billing information', 'credit-card', 2),
('Streaming Help', 'streaming', 'Troubleshoot streaming issues and optimize playback', 'play-circle', 3),
('Device Setup', 'devices', 'Set up and configure your streaming devices', 'monitor', 4),
('Network Help', 'network', 'Resolve network and connectivity issues', 'wifi', 5),
('System Status', 'status', 'Check service status and known issues', 'activity', 6);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_support_categories_updated_at
  BEFORE UPDATE ON support_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_articles_updated_at
  BEFORE UPDATE ON support_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();