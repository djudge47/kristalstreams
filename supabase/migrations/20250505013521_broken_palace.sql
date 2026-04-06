/*
  # Support Ticketing System

  1. New Tables
    - `support_tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `subject` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `category` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ticket_replies`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references support_tickets)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `is_staff` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for staff access
*/

-- Create support_tickets table
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_replies table
CREATE TABLE ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view all tickets"
  ON support_tickets
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Staff can manage tickets"
  ON support_tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for ticket_replies
CREATE POLICY "Users can view replies to own tickets"
  ON ticket_replies
  FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create replies to own tickets"
  ON ticket_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
    AND is_staff = false
  );

CREATE POLICY "Staff can view all replies"
  ON ticket_replies
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Staff can manage replies"
  ON ticket_replies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_replies_updated_at
  BEFORE UPDATE ON ticket_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();