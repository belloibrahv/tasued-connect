-- Migration: Create face-photos storage bucket
-- This bucket stores student face photos for facial recognition enrollment
-- Run this in Supabase SQL Editor or via migrations

-- ============================================
-- 1. CREATE THE STORAGE BUCKET
-- ============================================

-- Insert the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'face-photos',
  'face-photos',
  true,  -- Public for profile photo display
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 2. CREATE RLS POLICIES FOR THE BUCKET
-- ============================================

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Users can upload own face photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own face photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own face photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view face photos" ON storage.objects;

-- Policy: Allow authenticated users to upload to their own folder
-- The folder structure is: face-photos/{user_id}/filename.jpg
CREATE POLICY "Users can upload own face photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'face-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own photos
CREATE POLICY "Users can update own face photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'face-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'face-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete own face photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access for profile photos (needed for verification display)
CREATE POLICY "Anyone can view face photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'face-photos');

-- ============================================
-- 3. VERIFICATION QUERY
-- ============================================

-- Run this to verify the bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'face-photos';

-- Run this to verify policies were created:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
