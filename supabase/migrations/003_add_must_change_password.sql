-- =====================================================
-- PoultryOps
-- Migration 003
-- Add must_change_password flag to profiles
-- =====================================================

-- Add must_change_password column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN public.profiles.must_change_password IS 'Flag indicating user must change password on first login (used for invited users with temporary passwords)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password 
  ON public.profiles(must_change_password) 
  WHERE must_change_password = TRUE;