/*
  # Add Support Content and Categories

  1. Updates
    - Add more articles to existing categories
    - Add cross-references between articles
    - Update category descriptions
*/

-- Add more Getting Started articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'getting-started'),
'First Time Setup',
'first-time-setup',
'Get started with Kristal Streams in just a few minutes.

## Account Creation

1. Choose your plan
2. Create your account
3. Verify your email
4. Add payment method

## First Login

1. Access your dashboard
2. Set up your profile
3. Configure streaming preferences
4. Add favorite channels

## Device Setup

- Download our apps
- Sign in on your devices
- Set up parental controls
- Configure quality settings

Need help? Contact our support team 24/7.',
true),

((SELECT id FROM support_categories WHERE slug = 'getting-started'),
'Channel Guide',
'channel-guide',
'Learn how to navigate and find your favorite channels.

## Channel Categories

- Sports
- Movies
- News
- Entertainment
- Kids
- International

## Finding Content

1. Use the search bar
2. Browse by category
3. Check trending content
4. View recommended channels

## Creating Favorites

- Click the heart icon
- Create custom lists
- Set reminders
- Share with family',
true),

((SELECT id FROM support_categories WHERE slug = 'getting-started'),
'Streaming Quality Guide',
'streaming-quality',
'Optimize your streaming experience with these quality settings.

## Quality Levels

- 4K Ultra HD (25+ Mbps)
- 1080p Full HD (10+ Mbps)
- 720p HD (5+ Mbps)
- 480p SD (3+ Mbps)

## Adjusting Quality

1. Open player settings
2. Select quality level
3. Enable auto-adjust
4. Monitor bandwidth usage

## Best Practices

- Use wired connection
- Close background apps
- Update device firmware
- Clear cache regularly',
false);

-- Update category descriptions
UPDATE support_categories
SET description = 'Everything you need to know to get started with Kristal Streams'
WHERE slug = 'getting-started';

UPDATE support_categories
SET description = 'Manage your subscription, billing, and payment settings'
WHERE slug = 'billing';

UPDATE support_categories
SET description = 'Troubleshoot streaming issues and optimize your viewing experience'
WHERE slug = 'streaming';

UPDATE support_categories
SET description = 'Set up and configure Kristal Streams on your devices'
WHERE slug = 'devices';

UPDATE support_categories
SET description = 'Optimize your network for the best streaming experience'
WHERE slug = 'network';

UPDATE support_categories
SET description = 'Check system status and known issues'
WHERE slug = 'status';