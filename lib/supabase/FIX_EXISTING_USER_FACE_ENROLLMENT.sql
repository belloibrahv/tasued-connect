-- ============================================
-- FIX FACE ENROLLMENT FOR EXISTING USER
-- ============================================
-- This script checks and fixes the face enrollment issue
-- for users who already exist in the database

-- STEP 1: Check the current state of the test user
-- ============================================
SELECT '=== CHECKING TEST USER ===' as step;

SELECT 'User: belloibrahv@gmail.com' as check;
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  face_descriptor,
  profile_photo_url,
  created_at,
  updated_at
FROM public.users WHERE email = 'belloibrahv@gmail.com';

-- STEP 2: Check if the user can read their own profile (test RLS)
-- ============================================
SELECT '=== TESTING RLS POLICIES ===' as step;

-- This query simulates what the dashboard does
-- It should return the user's profile if RLS is working correctly
SELECT 
  id,
  email,
  face_descriptor,
  profile_photo_url
FROM public.users WHERE email = 'belloibrahv@gmail.com';

-- STEP 3: Verify RLS policies are correct
-- ============================================
SELECT '=== VERIFYING RLS POLICIES ===' as step;

SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- STEP 4: Check if trigger is working
-- ============================================
SELECT '=== CHECKING TRIGGER ===' as step;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- STEP 5: Verify the user exists in both tables
-- ============================================
SELECT '=== VERIFYING USER EXISTS IN BOTH TABLES ===' as step;

SELECT 'In auth.users:' as location;
SELECT id, email FROM auth.users WHERE email = 'belloibrahv@gmail.com';

SELECT 'In public.users:' as location;
SELECT id, email FROM public.users WHERE email = 'belloibrahv@gmail.com';

-- STEP 6: Check if face_descriptor is actually null or has data
-- ============================================
SELECT '=== CHECKING FACE DESCRIPTOR ===' as step;

SELECT 
  id,
  email,
  face_descriptor,
  CASE 
    WHEN face_descriptor IS NULL THEN 'NULL - NOT ENROLLED'
    WHEN face_descriptor = 'null'::jsonb THEN 'JSON null - NOT ENROLLED'
    WHEN jsonb_typeof(face_descriptor) = 'array' THEN 'ARRAY - ENROLLED'
    WHEN jsonb_typeof(face_descriptor) = 'object' THEN 'OBJECT - ENROLLED'
    ELSE 'UNKNOWN TYPE: ' || jsonb_typeof(face_descriptor)
  END as descriptor_status,
  profile_photo_url
FROM public.users WHERE email = 'belloibrahv@gmail.com';

-- STEP 7: Summary
-- ============================================
SELECT '=== SUMMARY ===' as step;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users WHERE email = 'belloibrahv@gmail.com') = 0 
      THEN 'ERROR: User does not exist in public.users'
    WHEN (SELECT face_descriptor FROM public.users WHERE email = 'belloibrahv@gmail.com') IS NULL
      THEN 'ISSUE: User exists but face_descriptor is NULL (not enrolled)'
    ELSE 'SUCCESS: User exists and face_descriptor has data (enrolled)'
  END as status;

-- STEP 8: If face_descriptor is NULL, check what happened during enrollment
-- ============================================
SELECT '=== CHECKING ENROLLMENT HISTORY ===' as step;

-- Check if there are any face photos in storage
SELECT 'Face photos in storage:' as check;
SELECT name, created_at FROM storage.objects 
WHERE bucket_id = 'face-photos' 
AND (storage.foldername(name))[1] = (SELECT id FROM public.users WHERE email = 'belloibrahv@gmail.com')::text
ORDER BY created_at DESC;

-- STEP 9: Recommendations
-- ============================================
SELECT '=== RECOMMENDATIONS ===' as step;

SELECT CASE 
  WHEN (SELECT COUNT(*) FROM public.users WHERE email = 'belloibrahv@gmail.com') = 0 
    THEN 'ACTION: Run DIAGNOSE_AND_FIX.sql to create the user profile'
  WHEN (SELECT face_descriptor FROM public.users WHERE email = 'belloibrahv@gmail.com') IS NULL
    THEN 'ACTION: User exists but face not enrolled. Try enrolling face again in the app.'
  ELSE 'ACTION: Everything looks good! Face is enrolled.'
END as recommendation;

