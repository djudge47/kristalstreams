/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing restrictive policies on profiles table
    - Create new policies that allow users to:
      - View their own profile
      - Insert their own profile (needed for registration)
      - Update their own profile
  
  2. Security
    - All policies check authentication
    - All policies verify user owns the profile (auth.uid() = id)
    - Policies are focused and specific to each operation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);