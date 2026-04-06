/*
  # Update subscription plans with correct Stripe price IDs

  1. Changes
    - Update subscription plans table with correct Stripe price IDs
    - Add proper plan features and descriptions
*/

-- Update subscription plans table
TRUNCATE TABLE subscription_plans;

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
  'price_1RMDCDH5y1cguXFGnLoGN0rt',
  'price_1RMDCDH5y1cguXFGnLoGN0rt'
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
  'price_1RMDCDH5y1cguXFGnLoGN0rt',
  'price_1RMDCDH5y1cguXFGnLoGN0rt'
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
  'price_1RMDCDH5y1cguXFGnLoGN0rt',
  'price_1RMDCDH5y1cguXFGnLoGN0rt'
);