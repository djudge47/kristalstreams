/*
  # Update Footer Content with Researched Links

  1. Updates
    - Clear existing footer links
    - Add comprehensive Quick Links section
    - Add detailed Support section
    - Based on industry research of streaming services

  2. Content Strategy
    - Quick Links: Essential user actions and popular pages
    - Support: Comprehensive help and technical assistance
    - Organized by user journey and common needs
*/

-- Clear existing footer links
DELETE FROM footer_links;

-- Insert researched Quick Links section
INSERT INTO footer_links (title, url, category, "order") VALUES
  -- Quick Links - Essential user actions
  ('Start Free Trial', '/free-trial', 'Quick Links', 1),
  ('View All Plans', '/pricing', 'Quick Links', 2),
  ('Sign In', '/login', 'Quick Links', 3),
  ('Create Account', '/register', 'Quick Links', 4),
  ('Channel Guide', '/channels', 'Quick Links', 5),
  ('Download Apps', '/support/devices', 'Quick Links', 6),
  ('Gift Cards', '/gift-cards', 'Quick Links', 7),
  ('Student Discount', '/student-discount', 'Quick Links', 8),

  -- Support - Comprehensive help section
  ('Help Center', '/support', 'Support', 1),
  ('Getting Started', '/support/getting-started', 'Support', 2),
  ('Device Setup', '/support/devices', 'Support', 3),
  ('Troubleshooting', '/support/streaming', 'Support', 4),
  ('Account & Billing', '/support/billing', 'Support', 5),
  ('Speed Test', '/support/speed-test', 'Support', 6),
  ('System Status', '/support/status', 'Support', 7),
  ('Contact Support', '/support#contact-section', 'Support', 8),
  ('Live Chat', '/support/chat', 'Support', 9),
  ('Community Forum', '/community', 'Support', 10),

  -- Company - About and legal
  ('About Us', '/about', 'Company', 1),
  ('Careers', '/careers', 'Company', 2),
  ('Press', '/press', 'Company', 3),
  ('Investor Relations', '/investors', 'Company', 4),
  ('Privacy Policy', '/privacy', 'Company', 5),
  ('Terms of Service', '/terms', 'Company', 6),
  ('Cookie Policy', '/cookies', 'Company', 7),
  ('Accessibility', '/accessibility', 'Company', 8),

  -- Features - Service highlights
  ('4K Streaming', '/features/4k', 'Features', 1),
  ('Live TV', '/features/live-tv', 'Features', 2),
  ('On Demand', '/features/on-demand', 'Features', 3),
  ('Sports Packages', '/features/sports', 'Features', 4),
  ('International Content', '/features/international', 'Features', 5),
  ('Premium Channels', '/features/premium', 'Features', 6),
  ('Parental Controls', '/features/parental-controls', 'Features', 7),
  ('Multi-Device', '/features/multi-device', 'Features', 8);