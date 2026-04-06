/*
  # Add Knowledge Base Content

  1. Updates
    - Add comprehensive knowledge base articles
    - Update existing categories with new content
    - Add cross-references between articles

  2. Content Categories
    - Getting Started
    - Troubleshooting
    - Account Management
    - Features & Settings
    - Network & Connectivity
    - Device Setup
*/

-- Add new articles to Getting Started category
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'getting-started'),
'Welcome to Kristal Streams',
'welcome-to-kristal-streams',
'Welcome to Kristal Streams! This guide will help you get started with our premium streaming service.

## What is Kristal Streams?

Kristal Streams is your gateway to premium streaming entertainment, offering:
- Thousands of live TV channels
- HD and 4K quality streaming
- Multi-device support
- 24/7 customer service
- Global content coverage

## Quick Start Guide

1. Create Your Account
   - Sign up at kristalstreams.com
   - Choose your subscription plan
   - Complete payment setup
   - Start streaming immediately

2. Download Our Apps
   - Smart TV apps
   - Mobile devices (iOS/Android)
   - Streaming devices
   - Web browser access

3. Start Streaming
   - Browse channel categories
   - Set up favorites
   - Customize quality settings
   - Create viewing profiles

## Key Features

- Multiple simultaneous streams
- Cloud DVR functionality
- Parental controls
- Custom playlists
- Cross-device sync
- Global content access',
true);

-- Add Troubleshooting articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'streaming-issues'),
'Common Streaming Issues',
'common-streaming-issues',
'Resolve common streaming issues with these troubleshooting steps.

## Buffering Issues

1. Check Internet Connection
   - Run speed test
   - Minimum 5 Mbps required
   - Use wired connection when possible
   - Reset router if needed

2. App Performance
   - Clear app cache
   - Update app version
   - Restart device
   - Check device storage

3. Quality Settings
   - Adjust streaming quality
   - Enable auto-quality
   - Check bandwidth usage
   - Monitor connection stability

## Video Quality Problems

1. Resolution Issues
   - Verify subscription plan
   - Check device compatibility
   - Update quality settings
   - Monitor network speed

2. Audio Sync
   - Restart stream
   - Clear app cache
   - Update app
   - Check device audio settings

## Connection Problems

1. Network Issues
   - Test internet speed
   - Reset network equipment
   - Check DNS settings
   - Verify VPN compatibility

2. Device Compatibility
   - Update device firmware
   - Check system requirements
   - Verify app compatibility
   - Update operating system',
true);

-- Add Account Management articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'account-billing'),
'Managing Your Subscription',
'managing-your-subscription',
'Learn how to manage your Kristal Streams subscription effectively.

## Subscription Plans

1. Basic Plan
   - Single device streaming
   - HD quality
   - Standard channels
   - Basic features

2. Premium Plan
   - Multiple device streaming
   - 4K quality available
   - Premium channels
   - Advanced features

3. Ultimate Plan
   - Maximum devices
   - All quality options
   - All channels
   - All features

## Payment Management

1. Payment Methods
   - Credit/Debit cards
   - PayPal
   - Bank transfer
   - Automatic renewal

2. Billing Cycle
   - Monthly billing
   - Annual options
   - Payment history
   - Invoice access

## Account Settings

1. Profile Management
   - Update information
   - Change password
   - Email preferences
   - Security settings

2. Device Management
   - View active devices
   - Remove devices
   - Set primary device
   - Manage permissions',
true);

-- Add Network & Connectivity articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'network'),
'Optimizing Your Network',
'optimizing-your-network',
'Get the best streaming experience with proper network setup.

## Network Requirements

1. Speed Requirements
   - 4K: 25+ Mbps
   - HD: 5+ Mbps
   - SD: 3+ Mbps
   - Multiple devices: Add 5 Mbps per device

2. Router Setup
   - Use 5GHz band
   - Enable QoS
   - Update firmware
   - Optimal placement

## Connection Types

1. Wired Connection
   - Ethernet cable
   - Network switches
   - Powerline adapters
   - Direct connection

2. Wireless Setup
   - WiFi optimization
   - Channel selection
   - Signal strength
   - Interference reduction

## Troubleshooting

1. Speed Issues
   - Run speed tests
   - Check router settings
   - Monitor usage
   - Contact ISP

2. Connection Problems
   - Reset equipment
   - Update firmware
   - Check cables
   - Verify settings',
true);

-- Add Device Setup articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'devices'),
'Device Compatibility Guide',
'device-compatibility-guide',
'Check device compatibility and setup requirements.

## Smart TVs

1. Samsung Smart TV
   - 2018 or newer models
   - Tizen OS 4.0+
   - Internet connection
   - App store access

2. LG Smart TV
   - WebOS 3.0+
   - 2017 or newer
   - Network capability
   - HD/4K support

## Mobile Devices

1. iOS Devices
   - iOS 14.0+
   - iPhone/iPad
   - Cellular streaming
   - Background playback

2. Android Devices
   - Android 8.0+
   - 2GB RAM minimum
   - Google Play Services
   - HD support

## Streaming Devices

1. Amazon Fire TV
   - All models supported
   - 1GB RAM minimum
   - HD/4K capability
   - Voice control

2. Roku Devices
   - All current models
   - Channel store access
   - Remote control
   - Quality options',
true);

-- Add Features & Settings articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'getting-started'),
'Advanced Features Guide',
'advanced-features-guide',
'Explore advanced features and settings in Kristal Streams.

## Streaming Features

1. Quality Control
   - Auto-quality adjustment
   - Manual quality selection
   - Bandwidth monitoring
   - Profile settings

2. Playback Options
   - Start from beginning
   - Resume watching
   - Picture-in-picture
   - Background play

## Account Features

1. Profiles
   - Multiple users
   - Parental controls
   - Viewing history
   - Preferences

2. Favorites
   - Channel favorites
   - Custom lists
   - Quick access
   - Sync across devices

## Security Features

1. Account Security
   - Two-factor auth
   - Device management
   - Login history
   - Password protection

2. Content Controls
   - Age restrictions
   - Content filtering
   - Access limits
   - Usage monitoring',
true);