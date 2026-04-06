/*
  # Support Content Migration
  
  This migration adds initial content for the support system.

  1. Content
    - Adds articles for each support category
    - Sets up featured articles
    - Initializes view counts and helpful counts
*/

-- Insert Getting Started articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'getting-started'),
'Quick Start Guide',
'quick-start-guide',
'Welcome to Kristal Streams! This guide will help you get started with our streaming service quickly and easily.

## Setting Up Your Account

1. Create your account or sign in
2. Choose your subscription plan
3. Add your payment information
4. Start streaming immediately

## Watching Content

- Browse our extensive library of channels
- Use the search function to find specific content
- Add favorites to your watchlist
- Adjust video quality settings

## Device Support

Stream on multiple devices including:
- Smart TVs
- Mobile devices
- Web browsers
- Streaming devices

## Need Help?

Contact our 24/7 support team if you need assistance.',
true);

-- Insert Billing articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'billing'),
'Understanding Your Subscription',
'understanding-subscription',
'Learn about Kristal Streams subscription plans and billing processes.

## Subscription Plans

- Basic Plan: 1 connection, HD streaming
- Standard Plan: 2 connections, HD streaming
- Premium Plan: 4 connections, 4K streaming
- Ultimate Plan: 4 connections, 4K streaming + premium channels

## Billing Cycle

- Monthly billing on the same date
- Cancel anytime with no penalties
- Prorated charges for plan changes

## Payment Methods

We accept:
- Credit/Debit cards
- PayPal
- Bank transfers

## Managing Your Subscription

- Change plans anytime
- Update payment information
- View billing history
- Download invoices',
true);

-- Insert Streaming Help articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'streaming'),
'Optimizing Your Stream Quality',
'optimize-stream-quality',
'Get the best streaming experience with these optimization tips.

## Video Quality Settings

- Auto: Automatically adjusts based on your connection
- 4K: Requires 25+ Mbps internet speed
- HD: Requires 5+ Mbps internet speed
- SD: Requires 3+ Mbps internet speed

## Common Issues

- Buffering: Check your internet connection
- Quality drops: Adjust quality settings
- Playback errors: Clear browser cache
- Audio sync: Restart the stream

## Best Practices

1. Use a stable internet connection
2. Close unnecessary browser tabs
3. Update your streaming device
4. Clear cache regularly',
true);

-- Insert Device Setup articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'devices'),
'Smart TV Setup Guide',
'smart-tv-setup',
'Set up Kristal Streams on your Smart TV for the best viewing experience.

## Supported Smart TVs

- Samsung Smart TV (2018 or newer)
- LG WebOS TV (3.0 or newer)
- Android TV
- Amazon Fire TV
- Roku TV

## Installation Steps

1. Access your TV''s app store
2. Search for "Kristal Streams"
3. Install the application
4. Sign in to your account

## Troubleshooting

- App not found: Check TV compatibility
- Cannot install: Check storage space
- Login issues: Reset password
- Playback issues: Check internet connection',
true);

-- Insert Network Help articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'network'),
'Internet Connection Guide',
'internet-connection',
'Ensure optimal streaming with proper network setup.

## Recommended Speeds

- 4K streaming: 25+ Mbps
- HD streaming: 5+ Mbps
- SD streaming: 3+ Mbps
- Multiple devices: Add 5 Mbps per device

## Network Tips

1. Use wired connections when possible
2. Position Wi-Fi router centrally
3. Avoid interference from other devices
4. Update router firmware

## Speed Test

Run a speed test to verify your connection:
1. Visit our speed test page
2. Click "Start Test"
3. Compare results with requirements',
true);

-- Insert System Status articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'status'),
'Service Status Overview',
'service-status',
'Check the current status of Kristal Streams services.

## Service Components

- Streaming Servers
- Authentication System
- Payment Processing
- Content Delivery Network

## Status Indicators

- ✅ Operational
- ⚠️ Performance Issues
- ❌ Service Disruption

## Maintenance Windows

- Scheduled: First Tuesday of each month
- Duration: 2-4 hours
- Time: 2:00 AM - 6:00 AM EST',
true);

-- Create function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views(article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE support_articles
  SET views = views + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment helpful count
CREATE OR REPLACE FUNCTION increment_article_helpful(article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE support_articles
  SET helpful_count = helpful_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;