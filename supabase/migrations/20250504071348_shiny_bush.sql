/*
  # Add device compatibility content
  
  1. New Content
    - Adds device compatibility articles to support_articles table
    - Links articles to the device compatibility category
    
  2. Changes
    - Updates existing category if needed
    - Adds new articles with device-specific information
*/

-- First, ensure we have the device compatibility category
INSERT INTO support_categories (name, slug, description, icon, "order")
VALUES (
  'Device Compatibility',
  'device-compatibility',
  'Check if your device is compatible with Kristal Streams and learn about system requirements.',
  'monitor',
  4
) ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- Add device compatibility articles
INSERT INTO support_articles (category_id, title, slug, content, is_featured) 
VALUES 
(
  (SELECT id FROM support_categories WHERE slug = 'device-compatibility'),
  'Smart TV Compatibility',
  'smart-tv-compatibility',
  'Kristal Streams is compatible with most modern Smart TVs. Here''s what you need to know:

Supported Smart TV Brands:
• Samsung Smart TVs (2018 and newer)
• LG Smart TVs (WebOS 3.0 and above)
• Sony Android TVs
• TCL Roku TVs
• Vizio SmartCast TVs
• Hisense Smart TVs

Requirements:
• Internet connection (minimum 5 Mbps, recommended 25 Mbps for 4K)
• Updated TV firmware
• Available storage space for app installation

Features:
• 4K Ultra HD streaming (on supported models)
• HDR support (on compatible devices)
• Dolby Digital audio
• Multiple audio tracks
• Subtitle support',
  true
),
(
  (SELECT id FROM support_categories WHERE slug = 'device-compatibility'),
  'Mobile Device Requirements',
  'mobile-requirements',
  'Access Kristal Streams on your mobile devices with these specifications:

iOS Devices:
• iPhone running iOS 14.0 or later
• iPad running iPadOS 14.0 or later
• Available storage: 200MB minimum
• Cellular streaming supported
• Offline downloads available

Android Devices:
• Android 8.0 (Oreo) or higher
• RAM: 2GB minimum
• Available storage: 200MB minimum
• Support for hardware-accelerated video playback
• Google Play Services installed

Features:
• HD and Full HD streaming
• Picture-in-Picture support
• Background playback
• Download for offline viewing
• Multiple audio tracks
• Subtitle support',
  true
),
(
  (SELECT id FROM support_categories WHERE slug = 'device-compatibility'),
  'Gaming Console Support',
  'gaming-console-support',
  'Stream your favorite content on gaming consoles:

PlayStation:
• PS4 (all models)
• PS5
• PSN account required
• System software up to date

Xbox:
• Xbox One (all models)
• Xbox Series S
• Xbox Series X
• Xbox Live account required
• Latest system update installed

Features:
• 4K streaming (on PS5 and Xbox Series X)
• HDR support
• Surround sound
• Controller navigation
• Voice commands (where supported)',
  false
),
(
  (SELECT id FROM support_categories WHERE slug = 'device-compatibility'),
  'Computer System Requirements',
  'computer-requirements',
  'Stream Kristal Streams on your computer with these requirements:

Windows PC:
• Windows 10 or later
• Intel Core i3 or equivalent (i5 recommended for 4K)
• 4GB RAM minimum (8GB recommended)
• DirectX 9 capable GPU
• Latest version of Chrome, Firefox, or Edge

Mac:
• macOS 10.15 (Catalina) or later
• Intel or Apple Silicon processor
• 4GB RAM minimum (8GB recommended)
• Latest version of Safari, Chrome, or Firefox

Linux:
• Ubuntu 18.04 or later
• 4GB RAM minimum
• Hardware acceleration support
• Latest version of Chrome or Firefox

Features:
• Up to 4K streaming (hardware dependent)
• Multiple audio tracks
• Subtitle support
• Keyboard shortcuts
• Picture-in-Picture mode',
  false
),
(
  (SELECT id FROM support_categories WHERE slug = 'device-compatibility'),
  'Streaming Device Compatibility',
  'streaming-device-compatibility',
  'Use Kristal Streams on popular streaming devices:

Amazon Fire TV:
• Fire TV Stick (all models)
• Fire TV Cube
• Fire TV Edition smart TVs
• 1GB RAM minimum
• Fire OS 5.0 or higher

Roku:
• Roku Express/Express+
• Roku Streaming Stick/Streaming Stick+
• Roku Ultra
• Roku TV
• OS 9.0 or higher

Apple TV:
• Apple TV HD (4th generation)
• Apple TV 4K (all generations)
• tvOS 14.0 or later

Chromecast:
• Chromecast (2nd generation and newer)
• Chromecast with Google TV
• Android TV devices

Features:
• 4K streaming (on supported devices)
• HDR support
• Voice control
• Remote control support
• Multiple audio tracks
• Subtitle support',
  true
);