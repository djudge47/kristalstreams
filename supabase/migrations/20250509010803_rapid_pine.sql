/*
  # Email Configuration Schema

  1. New Tables
    - `email_templates`: Stores email templates for different purposes
    - `email_settings`: Stores email configuration settings
    - `email_logs`: Tracks sent emails

  2. Security
    - Enable RLS
    - Add policies for service role access
*/

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  reply_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id),
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage email templates"
  ON email_templates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage email settings"
  ON email_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage email logs"
  ON email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default email settings
INSERT INTO email_settings (name, email, display_name, reply_to) VALUES
  ('support', 'support@kristalstreams.com', 'Kristal Streams Support', 'support@kristalstreams.com'),
  ('billing', 'billing@kristalstreams.com', 'Kristal Streams Billing', 'billing@kristalstreams.com'),
  ('info', 'info@kristalstreams.com', 'Kristal Streams', 'info@kristalstreams.com'),
  ('noreply', 'noreply@kristalstreams.com', 'Kristal Streams', null);

-- Insert email templates
INSERT INTO email_templates (name, subject, body, variables) VALUES
  (
    'welcome_email',
    'Welcome to Kristal Streams!',
    'Hi {{name}},\n\nWelcome to Kristal Streams! We''re excited to have you on board.\n\nYour account has been successfully created and you can now start streaming your favorite content.\n\nIf you need any assistance, our support team is available 24/7.\n\nBest regards,\nThe Kristal Streams Team',
    '["name"]'::jsonb
  ),
  (
    'password_reset',
    'Reset Your Password',
    'Hi {{name}},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n{{reset_link}}\n\nIf you didn''t request this, please ignore this email.\n\nBest regards,\nThe Kristal Streams Team',
    '["name", "reset_link"]'::jsonb
  ),
  (
    'subscription_confirmation',
    'Subscription Confirmed',
    'Hi {{name}},\n\nThank you for subscribing to Kristal Streams {{plan_name}}!\n\nYour subscription is now active and you can enjoy all the features included in your plan.\n\nIf you have any questions, please don''t hesitate to contact our support team.\n\nBest regards,\nThe Kristal Streams Team',
    '["name", "plan_name"]'::jsonb
  ),
  (
    'payment_receipt',
    'Payment Receipt - Kristal Streams',
    'Hi {{name}},\n\nThank you for your payment of {{amount}}.\n\nSubscription: {{plan_name}}\nBilling Period: {{billing_period}}\n\nYou can view your billing history in your account settings.\n\nBest regards,\nThe Kristal Streams Team',
    '["name", "amount", "plan_name", "billing_period"]'::jsonb
  ),
  (
    'support_ticket',
    'Support Ticket #{{ticket_id}} - {{subject}}',
    'Hi {{name}},\n\nThank you for contacting Kristal Streams support. Your ticket has been received and our team will respond shortly.\n\nTicket Details:\nID: {{ticket_id}}\nSubject: {{subject}}\n\nYou can view your ticket status in your account.\n\nBest regards,\nThe Kristal Streams Support Team',
    '["name", "ticket_id", "subject"]'::jsonb
  );

-- Create updated_at triggers
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();