/*
  # Initial Schema Setup for Kristal Streams

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `subscription_tier` (text)
      - `subscription_status` (text)
      - `connections_allowed` (int)
      - `active_connections` (int)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `plan_id` (text)
      - `status` (text)
      - `current_period_start` (timestamp)
      - `current_period_end` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `streaming_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `channel_id` (text)
      - `started_at` (timestamp)
      - `ended_at` (timestamp)
      - `device_info` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  subscription_tier text DEFAULT 'basic',
  subscription_status text DEFAULT 'inactive',
  connections_allowed int DEFAULT 1,
  active_connections int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create streaming_sessions table
CREATE TABLE streaming_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  channel_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  device_info jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for streaming sessions
CREATE POLICY "Users can view own streaming sessions"
  ON streaming_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own streaming sessions"
  ON streaming_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();