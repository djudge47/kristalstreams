/*
  # Fix profiles table RLS policies

  1. Changes
    - Add policy for users to insert their own profile
    - Update existing policies to use auth.uid() consistently
    - Add policy for service role to manage all profiles

  2. Security
    - Maintain RLS on profiles table
    - Add specific policy for profile creation
    - Ensure users can only manage their own data
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create comprehensive policies for user profile management
CREATE POLICY "Users can manage own profile"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role can manage all profiles"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);