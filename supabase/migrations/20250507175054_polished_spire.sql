/*
  # Add notifications settings to profiles

  1. Changes
    - Add `notifications_enabled` column to `profiles` table with default value of false
    
  2. Notes
    - Uses a safe migration pattern with IF NOT EXISTS check
    - Sets default value to ensure data consistency for existing rows
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'notifications_enabled'
  ) THEN 
    ALTER TABLE profiles 
    ADD COLUMN notifications_enabled boolean DEFAULT false;
  END IF;
END $$;