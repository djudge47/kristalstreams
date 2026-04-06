/*
  # Support Email System

  1. New Table
    - `support_emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `subject` (text)
      - `message` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add policies for staff access
*/

CREATE TABLE support_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE support_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own emails"
  ON support_emails
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create emails"
  ON support_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view all emails"
  ON support_emails
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Staff can manage emails"
  ON support_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_support_emails_updated_at
  BEFORE UPDATE ON support_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();