/*
  # Add Stripe-related fields to profiles and subscriptions tables

  1. Changes
    - Add stripe_customer_id to profiles table
    - Add stripe_subscription_id to subscriptions table
    - Add subscription plan details
*/

-- Add Stripe fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'basic';

-- Add Stripe fields to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_monthly integer NOT NULL,
  price_yearly integer NOT NULL,
  features jsonb DEFAULT '[]',
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public read access to subscription plans"
  ON subscription_plans FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage subscription plans"
  ON subscription_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default plans
INSERT INTO subscription_plans (
  id, name, description, price_monthly, price_yearly,
  features, stripe_price_id_monthly, stripe_price_id_yearly
) VALUES
(
  'basic',
  'Basic Plan',
  'Essential streaming package',
  1599,
  15990,
  '[
    "1 connection",
    "HD streaming",
    "Basic channels",
    "24/7 support"
  ]'::jsonb,
  'price_basic_monthly',
  'price_basic_yearly'
),
(
  'standard',
  'Standard Plan',
  'Enhanced streaming experience',
  2599,
  25990,
  '[
    "2 connections",
    "HD streaming",
    "Premium channels",
    "24/7 priority support",
    "No ads"
  ]'::jsonb,
  'price_standard_monthly',
  'price_standard_yearly'
),
(
  'premium',
  'Premium Plan',
  'Ultimate streaming package',
  3599,
  35990,
  '[
    "4 connections",
    "4K Ultra HD",
    "All channels",
    "Premium support",
    "No ads",
    "Offline downloads"
  ]'::jsonb,
  'price_premium_monthly',
  'price_premium_yearly'
);