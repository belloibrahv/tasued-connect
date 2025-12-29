-- ============================================
-- CRITICAL MIGRATION - RUN THIS FIRST
-- ============================================
-- This migration fixes the "Face not enrolled" issue by:
-- 1. Adding the face_descriptor column to users table
-- 2. Creating the face-photos storage bucket
-- 3. Fixing the handle_new_user trigger
-- 
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Add face_descriptor column
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS face_descriptor JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_face_descriptor 
ON public.users USING GIN (face_descriptor);

COMMENT ON COLUMN public.users.face_descriptor IS 
'128-dimensional face embedding vector stored as JSON array for face recognition';

-- ============================================
-- STEP 2: Create face-photos storage bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'face-photos',
  'face-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload own face photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own face photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own face photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view face photos" ON storage.objects;

CREATE POLICY "Users can upload own face photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'face-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own face photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'face-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'face-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own face photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'face-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view face photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'face-photos');

-- ============================================
-- STEP 3: Fix handle_new_user trigger
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_matric TEXT;
  user_staff_id TEXT;
  user_level TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  IF user_role = 'student' THEN
    user_matric := NULLIF(NEW.raw_user_meta_data->>'matric_number', '');
    IF user_matric IS NULL THEN
      user_matric := 'TEMP-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    user_level := NULLIF(NEW.raw_user_meta_data->>'level', '');
    IF user_level IS NOT NULL AND user_level NOT IN ('100', '200', '300', '400', '500', 'PG') THEN
      user_level := NULL;
    END IF;
  ELSE
    user_matric := NULL;
    user_level := NULL;
  END IF;
  
  IF user_role = 'lecturer' THEN
    user_staff_id := NULLIF(NEW.raw_user_meta_data->>'staff_id', '');
    IF user_staff_id IS NULL THEN
      user_staff_id := 'STF-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  ELSE
    user_staff_id := NULL;
  END IF;

  INSERT INTO public.users (
    id, email, role, first_name, last_name, matric_number, staff_id, 
    department, level, title, phone_number, is_active, is_email_verified
  )
  VALUES (
    NEW.id, NEW.email, user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Unknown'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
    user_matric, user_staff_id,
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    user_level,
    NULLIF(NEW.raw_user_meta_data->>'title', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
    true, true
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create public.users record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 4: Fix existing users without profiles
-- ============================================
DO $$
DECLARE
  auth_user RECORD;
  user_role TEXT;
  user_matric TEXT;
  user_staff_id TEXT;
  user_level TEXT;
BEGIN
  FOR auth_user IN 
    SELECT au.* FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    user_role := COALESCE(auth_user.raw_user_meta_data->>'role', 'student');
    
    IF user_role = 'student' THEN
      user_matric := COALESCE(NULLIF(auth_user.raw_user_meta_data->>'matric_number', ''), 'TEMP-' || SUBSTRING(auth_user.id::text, 1, 8));
      user_staff_id := NULL;
      user_level := NULLIF(auth_user.raw_user_meta_data->>'level', '');
      IF user_level IS NOT NULL AND user_level NOT IN ('100', '200', '300', '400', '500', 'PG') THEN
        user_level := NULL;
      END IF;
    ELSIF user_role = 'lecturer' THEN
      user_staff_id := COALESCE(NULLIF(auth_user.raw_user_meta_data->>'staff_id', ''), 'STF-' || SUBSTRING(auth_user.id::text, 1, 8));
      user_matric := NULL;
      user_level := NULL;
    ELSE
      user_matric := NULL;
      user_staff_id := NULL;
      user_level := NULL;
    END IF;
    
    BEGIN
      INSERT INTO public.users (
        id, email, role, first_name, last_name, 
        matric_number, staff_id, department, level, title,
        is_active, is_email_verified
      )
      VALUES (
        auth_user.id, auth_user.email, user_role,
        COALESCE(NULLIF(auth_user.raw_user_meta_data->>'first_name', ''), 'Unknown'),
        COALESCE(NULLIF(auth_user.raw_user_meta_data->>'last_name', ''), 'User'),
        user_matric, user_staff_id,
        NULLIF(auth_user.raw_user_meta_data->>'department', ''),
        user_level,
        NULLIF(auth_user.raw_user_meta_data->>'title', ''),
        true, true
      );
      RAISE NOTICE 'Created public.users record for: %', auth_user.email;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Skipped % due to unique constraint', auth_user.email;
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed for %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- STEP 5: Add RLS policies for users table
-- ============================================

-- First, check if RLS is enabled and add necessary policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can update own face data" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own data (for face enrollment)
CREATE POLICY "Users can update own face data"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow service role full access (for API routes)
CREATE POLICY "Service role has full access"
ON public.users
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES (run these to check)
-- ============================================
-- Check face_descriptor column exists:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_descriptor';

-- Check storage bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'face-photos';

-- Check trigger exists:
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check users without profiles:
-- SELECT au.email FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL;
