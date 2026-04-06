-- Add new support articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) VALUES
((SELECT id FROM support_categories WHERE slug = 'streaming-issues'),
'Buffering and Playback Issues',
'buffering-playback-issues',
'Experiencing buffering or playback issues? Follow these steps to resolve common streaming problems.

## Quick Solutions

1. Check Internet Connection
   - Run a speed test at speedtest.net
   - Minimum requirements:
     • SD Quality: 3+ Mbps
     • HD Quality: 5+ Mbps
     • 4K Quality: 25+ Mbps
   - Reset your router if needed
   - Use wired connection when possible

2. Clear App Cache
   - Smart TV: Clear app cache in settings
   - Mobile: Clear app data and cache
   - Browser: Clear browser cache
   - Streaming device: Restart device

3. Quality Settings
   - Lower quality during peak hours
   - Enable auto-quality adjustment
   - Check bandwidth usage
   - Monitor connection stability

## Advanced Troubleshooting

1. Network Configuration
   - Use 5GHz WiFi when available
   - Check DNS settings
   - Disable VPN/proxy
   - Update router firmware

2. Device Settings
   - Update app version
   - Check device storage
   - Update system software
   - Verify device compatibility

3. Connection Issues
   - Check for ISP outages
   - Verify router settings
   - Test different devices
   - Monitor network traffic

Still having issues? Contact our support team for assistance.',
true),

((SELECT id FROM support_categories WHERE slug = 'network'),
'Network Optimization Guide',
'network-optimization',
'Optimize your network for the best streaming experience with these comprehensive tips.

## Network Requirements

1. Speed Requirements
   - 4K Streaming: 25+ Mbps
   - HD Streaming: 5+ Mbps
   - SD Streaming: 3+ Mbps
   - Multiple devices: Add 5 Mbps per device

2. Router Setup
   - Position router centrally
   - Use 5GHz band when possible
   - Enable QoS settings
   - Update firmware regularly

## Connection Types

1. Wired Connection (Recommended)
   - Use CAT6 ethernet cables
   - Direct connection to router
   - Avoid powerline adapters
   - Check cable integrity

2. Wireless Setup
   - Choose less congested channels
   - Minimize interference
   - Use WiFi extenders if needed
   - Enable WPA3 security

## Advanced Settings

1. Router Configuration
   - Enable QoS for streaming
   - Set up DHCP reservations
   - Configure port forwarding
   - Optimize DNS settings

2. Network Monitoring
   - Track bandwidth usage
   - Monitor connected devices
   - Check for interference
   - Test network stability

Need help? Contact our support team for personalized assistance.',
true),

((SELECT id FROM support_categories WHERE slug = 'devices'),
'Smart TV Configuration Guide',
'smart-tv-configuration',
'Complete guide for setting up Kristal Streams on your Smart TV.

## Supported Smart TVs

1. Samsung Smart TV
   - 2018 or newer models
   - Tizen OS 4.0+
   - Internet connection required
   - HD/4K capability

2. LG Smart TV
   - WebOS 3.0+
   - 2017 or newer models
   - Network connectivity
   - App store access

## Installation Steps

1. Samsung TV Setup
   - Press Home button
   - Navigate to Apps
   - Search "Kristal Streams"
   - Install and launch
   - Sign in to account

2. LG TV Setup
   - Access LG Content Store
   - Search for app
   - Download and install
   - Open and login
   - Configure settings

## Optimization Tips

1. Picture Settings
   - Enable HDR if available
   - Adjust brightness/contrast
   - Set color temperature
   - Configure motion settings

2. Audio Setup
   - Select audio output
   - Configure surround sound
   - Adjust audio sync
   - Set default volume

Need assistance? Our support team is available 24/7.',
true);

-- Update existing articles with more detailed content
UPDATE support_articles 
SET content = 'Complete guide to getting started with Kristal Streams.

## Account Setup

1. Create Account
   - Visit kristalstreams.com
   - Click "Start Free Trial"
   - Enter email and password
   - Choose subscription plan
   - Add payment method

2. Device Setup
   - Download app on devices
   - Sign in to account
   - Configure preferences
   - Set up profiles

3. Start Streaming
   - Browse channels
   - Add favorites
   - Set quality preferences
   - Enable notifications

## Features Overview

1. Streaming Features
   - Live TV channels
   - On-demand content
   - DVR functionality
   - Multi-device support

2. Account Features
   - Multiple profiles
   - Parental controls
   - Viewing history
   - Device management

Need help? Contact our support team.'
WHERE slug = 'getting-started-guide';

-- Add more categories if needed
INSERT INTO support_categories (name, slug, description, icon, "order")
VALUES 
('Technical Issues', 'technical-issues', 'Resolve technical problems and improve streaming performance', 'settings', 7),
('Account Management', 'account-management', 'Manage your account settings and preferences', 'user', 8)
ON CONFLICT (slug) DO NOTHING;