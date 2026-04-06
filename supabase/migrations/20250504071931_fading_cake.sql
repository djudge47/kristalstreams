-- First, ensure we have the help center categories
INSERT INTO support_categories (name, slug, description, icon, "order")
VALUES 
(
  'Getting Started',
  'getting-started',
  'Essential guides to help you start streaming with Kristal Streams.',
  'book-open',
  1
),
(
  'Account & Billing',
  'account-billing',
  'Manage your account, subscription, and billing information.',
  'credit-card',
  2
),
(
  'Streaming Issues',
  'streaming-issues',
  'Troubleshoot common streaming problems and optimize your experience.',
  'play-circle',
  3
),
(
  'Technical Support',
  'technical-support',
  'Technical guidance and solutions for common issues.',
  'settings',
  5
),
(
  'FAQ',
  'faq',
  'Frequently asked questions about our service.',
  'help-circle',
  6
) ON CONFLICT (slug) DO NOTHING;

-- Add help center articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) 
VALUES 
(
  (SELECT id FROM support_categories WHERE slug = 'getting-started'),
  'Quick Start Guide',
  'quick-start-guide',
  'Welcome to Kristal Streams! Follow this guide to start streaming in minutes.

1. Create Your Account
• Visit kristalstreams.com
• Click "Start Free Trial"
• Enter your email and create a password
• Choose your subscription plan

2. Download the App
• Available on multiple platforms
• Smart TVs, mobile devices, and streaming devices
• Follow device-specific installation guides

3. Sign In and Start Streaming
• Launch the app
• Enter your login credentials
• Browse available channels
• Select content to start watching

4. Optimize Your Experience
• Check your internet connection
• Adjust video quality settings
• Enable notifications for new content
• Set up favorite channels

Need help? Contact our 24/7 support team.',
  true
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_featured = EXCLUDED.is_featured,
  category_id = EXCLUDED.category_id;

INSERT INTO support_articles (category_id, title, slug, content, is_featured) 
VALUES 
(
  (SELECT id FROM support_categories WHERE slug = 'account-billing'),
  'Managing Your Subscription',
  'managing-subscription',
  'Learn how to manage your Kristal Streams subscription effectively.

Subscription Management:
• View current plan details
• Change subscription tier
• Update payment method
• Cancel or pause subscription

Payment Information:
• Accepted payment methods
• Billing cycle dates
• Invoice history
• Payment troubleshooting

Account Settings:
• Update profile information
• Change password
• Manage email preferences
• Device management

Need to make changes? Visit your account dashboard.',
  true
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_featured = EXCLUDED.is_featured,
  category_id = EXCLUDED.category_id;

INSERT INTO support_articles (category_id, title, slug, content, is_featured) 
VALUES 
(
  (SELECT id FROM support_categories WHERE slug = 'streaming-issues'),
  'Buffering Solutions',
  'buffering-solutions',
  'Experience buffering issues? Here are solutions to common streaming problems.

Quick Fixes:
• Check internet connection speed
• Clear app cache and data
• Restart your device
• Lower video quality temporarily

Network Optimization:
• Use 5GHz WiFi when possible
• Connect via ethernet cable
• Close background apps
• Update network drivers

Advanced Solutions:
• Configure DNS settings
• Check for VPN interference
• Update device firmware
• Contact your ISP if issues persist',
  true
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_featured = EXCLUDED.is_featured,
  category_id = EXCLUDED.category_id;

INSERT INTO support_articles (category_id, title, slug, content, is_featured) 
VALUES 
(
  (SELECT id FROM support_categories WHERE slug = 'technical-support'),
  'Device Connection Guide',
  'device-connection',
  'Connect your devices to Kristal Streams with these technical guidelines.

Connection Methods:
• Direct app installation
• Casting/mirroring
• Web browser streaming
• External devices

Troubleshooting Steps:
• Verify device compatibility
• Check network requirements
• Update system software
• Configure display settings

Security Measures:
• Secure your network
• Enable two-factor authentication
• Monitor active devices
• Protect your password',
  false
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_featured = EXCLUDED.is_featured,
  category_id = EXCLUDED.category_id;

INSERT INTO support_articles (category_id, title, slug, content, is_featured) 
VALUES 
(
  (SELECT id FROM support_categories WHERE slug = 'faq'),
  'Common Questions',
  'common-questions',
  'Find answers to frequently asked questions about Kristal Streams.

Subscription Questions:
• How many devices can I use?
• Can I share my account?
• How do I cancel?
• What payment methods are accepted?

Content Questions:
• What channels are included?
• Is 4K available?
• Can I download content?
• Are there ads?

Technical Questions:
• Minimum internet speed?
• Supported devices?
• Storage requirements?
• Offline viewing?

Still have questions? Contact our support team.',
  true
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_featured = EXCLUDED.is_featured,
  category_id = EXCLUDED.category_id;