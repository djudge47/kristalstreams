/*
  # Populate Setup Guides Content

  This migration adds initial content for setup guides covering different devices and scenarios.

  1. Content
    - Adds setup guides for various devices
    - Includes difficulty levels and estimated completion times
    - Provides detailed step-by-step instructions
*/

-- Insert Smart TV Setup Guides
INSERT INTO setup_guides (title, slug, content, device_type, difficulty, estimated_time) VALUES
(
  'Samsung Smart TV Setup Guide',
  'samsung-smart-tv-setup',
  'Setting up Kristal Streams on your Samsung Smart TV is quick and easy. Follow these steps for the best streaming experience.

1. Ensure your Samsung Smart TV is connected to the internet
2. Press the Home button on your remote
3. Navigate to the Apps section
4. Search for "Kristal Streams" using the search function
5. Select and download the Kristal Streams app
6. Once installed, open the app
7. Sign in with your Kristal Streams account
8. Select your preferred video quality in the settings
9. Start enjoying your favorite content

For the best experience, we recommend:
• Internet speed of at least 25 Mbps for 4K streaming
• Latest TV firmware installed
• TV connected via ethernet cable for optimal performance',
  'Smart TV',
  'Easy',
  15
),
(
  'LG Smart TV Installation Guide',
  'lg-smart-tv-setup',
  'Get Kristal Streams up and running on your LG Smart TV with these simple steps.

1. Connect your LG Smart TV to your home network
2. Access the LG Content Store
3. Search for the Kristal Streams app
4. Download and install the application
5. Launch Kristal Streams
6. Log in to your account
7. Configure your streaming preferences
8. Test playback with a sample video

Pro Tips:
• Use 5GHz WiFi for better streaming performance
• Keep your TV software updated
• Clear app cache regularly for optimal performance',
  'Smart TV',
  'Easy',
  12
);

-- Insert Mobile Device Guides
INSERT INTO setup_guides (title, slug, content, device_type, difficulty, estimated_time) VALUES
(
  'iOS Device Setup Guide',
  'ios-setup',
  'Install and configure Kristal Streams on your iPhone or iPad with this comprehensive guide.

1. Open the App Store on your iOS device
2. Search for "Kristal Streams"
3. Download and install the app
4. Open Kristal Streams
5. Sign in to your account
6. Enable notifications (optional)
7. Configure video quality settings
8. Set up offline viewing preferences
9. Test streaming on both WiFi and cellular data

Additional Settings:
• Enable Background App Refresh for better performance
• Configure cellular data usage limits
• Set up Face ID/Touch ID for secure login
• Enable picture-in-picture mode',
  'Mobile',
  'Easy',
  10
),
(
  'Android Device Configuration',
  'android-setup',
  'Follow these steps to set up Kristal Streams on your Android smartphone or tablet.

1. Open the Google Play Store
2. Search for "Kristal Streams"
3. Install the application
4. Launch Kristal Streams
5. Log in to your account
6. Grant necessary permissions
7. Configure streaming quality
8. Set up download preferences
9. Test playback functionality

Optimization Tips:
• Clear app cache periodically
• Enable auto-update for the latest features
• Configure battery optimization settings
• Set up secure lock screen access',
  'Mobile',
  'Easy',
  10
);

-- Insert Gaming Console Guides
INSERT INTO setup_guides (title, slug, content, device_type, difficulty, estimated_time) VALUES
(
  'PlayStation 5 Setup Instructions',
  'ps5-setup',
  'Get Kristal Streams running on your PS5 with this detailed setup guide.

1. Power on your PlayStation 5
2. Navigate to the PlayStation Store
3. Search for "Kristal Streams"
4. Download and install the app
5. Launch Kristal Streams
6. Sign in to your account
7. Configure HDR settings if available
8. Set up controller shortcuts
9. Test streaming performance

Recommended Settings:
• Enable 4K output if supported
• Configure audio output settings
• Set up automatic login
• Adjust controller timeout settings',
  'Gaming Console',
  'Medium',
  20
),
(
  'Xbox Series X/S Configuration',
  'xbox-series-setup',
  'Configure Kristal Streams on your Xbox Series X/S for the ultimate streaming experience.

1. Turn on your Xbox
2. Go to the Microsoft Store
3. Search for Kristal Streams
4. Install the application
5. Open Kristal Streams
6. Log in to your account
7. Configure display settings
8. Set up audio preferences
9. Test streaming quality

Advanced Setup:
• Enable Quick Resume support
• Configure HDR settings
• Set up voice commands
• Optimize network settings',
  'Gaming Console',
  'Medium',
  20
);

-- Insert Computer Setup Guides
INSERT INTO setup_guides (title, slug, content, device_type, difficulty, estimated_time) VALUES
(
  'Windows PC Browser Setup',
  'windows-browser-setup',
  'Set up Kristal Streams in your preferred browser on Windows.

1. Open your preferred browser (Chrome, Firefox, or Edge)
2. Visit kristalstreams.com
3. Create an account or sign in
4. Enable hardware acceleration in browser settings
5. Configure video quality preferences
6. Set up keyboard shortcuts
7. Test playback performance
8. Enable notifications (optional)

Browser-Specific Tips:
• Chrome: Enable GPU acceleration
• Firefox: Update media codecs
• Edge: Configure tracking prevention
• All: Clear browser cache regularly',
  'Computer',
  'Easy',
  8
),
(
  'macOS Setup Guide',
  'macos-setup',
  'Configure Kristal Streams on your Mac for optimal streaming performance.

1. Launch Safari or your preferred browser
2. Navigate to kristalstreams.com
3. Sign in to your account
4. Configure System Preferences
5. Set up keyboard shortcuts
6. Enable picture-in-picture
7. Test streaming quality
8. Configure energy settings

Optimization Steps:
• Enable hardware acceleration
• Update your browser
• Configure firewall settings
• Optimize network preferences',
  'Computer',
  'Easy',
  8
);

-- Insert Streaming Device Guides
INSERT INTO setup_guides (title, slug, content, device_type, difficulty, estimated_time) VALUES
(
  'Amazon Fire TV Stick Setup',
  'fire-tv-setup',
  'Install and configure Kristal Streams on your Fire TV Stick.

1. Power on your Fire TV Stick
2. Navigate to the Amazon Appstore
3. Search for "Kristal Streams"
4. Download and install the app
5. Launch Kristal Streams
6. Sign in to your account
7. Configure display settings
8. Set up remote shortcuts
9. Test streaming performance

Additional Configuration:
• Enable HDR if supported
• Configure audio output
• Set up Alexa voice commands
• Optimize network settings',
  'Streaming Device',
  'Easy',
  15
),
(
  'Roku Device Configuration',
  'roku-setup',
  'Set up Kristal Streams on your Roku streaming device.

1. Turn on your Roku device
2. Go to the Roku Channel Store
3. Find and add Kristal Streams
4. Install the channel
5. Launch Kristal Streams
6. Log in to your account
7. Configure display preferences
8. Set up audio settings
9. Test channel performance

Optimization Tips:
• Update Roku software
• Configure network settings
• Set up quick launch
• Enable auto-sign in',
  'Streaming Device',
  'Easy',
  15
);