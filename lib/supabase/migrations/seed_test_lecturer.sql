-- =====================================================
-- SEED TEST LECTURER FOR TASUED FACECHECK
-- =====================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- 
-- This creates:
-- 1. A lecturer auth user (Dr. Ogunsanwo)
-- 2. A corresponding entry in the users table
-- 3. Assigns existing courses to this lecturer
-- =====================================================

-- Step 1: Create the auth user
-- Note: You'll need to set the password via Supabase Dashboard or use their API
-- Go to Authentication > Users > Add User after running this, OR use the invite method

-- First, let's create the user profile in the users table
-- The auth.users entry should be created via Supabase Dashboard

DO $$
DECLARE
    lecturer_id UUID;
BEGIN
    -- Check if lecturer already exists by email
    SELECT id INTO lecturer_id FROM auth.users WHERE email = 'ogunsanwo@tasued.edu.ng';
    
    IF lecturer_id IS NULL THEN
        RAISE NOTICE 'Lecturer auth user not found. Please create via Supabase Dashboard first.';
        RAISE NOTICE 'Go to Authentication > Users > Add User';
        RAISE NOTICE 'Email: ogunsanwo@tasued.edu.ng';
        RAISE NOTICE 'Password: Lecturer123!';
    ELSE
        -- Insert into users table if not exists
        INSERT INTO public.users (id, email, first_name, last_name, role, title, staff_id, department, created_at, updated_at)
        VALUES (
            lecturer_id,
            'ogunsanwo@tasued.edu.ng',
            'Ganiyu',
            'Ogunsanwo',
            'lecturer',
            'Dr.',
            'STF/CSC/001',
            'Computer Science',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            first_name = 'Ganiyu',
            last_name = 'Ogunsanwo',
            role = 'lecturer',
            title = 'Dr.',
            staff_id = 'STF/CSC/001',
            department = 'Computer Science',
            updated_at = NOW();
            
        -- Assign courses to this lecturer
        UPDATE public.courses 
        SET lecturer_id = lecturer_id 
        WHERE lecturer_id IS NULL 
           OR code IN ('CSC 415', 'CSC 412');
           
        RAISE NOTICE 'Lecturer profile updated and courses assigned!';
    END IF;
END $$;

-- =====================================================
-- ALTERNATIVE: Manual Steps in Supabase Dashboard
-- =====================================================
-- 
-- 1. Go to Authentication > Users > Add User
--    - Email: ogunsanwo@tasued.edu.ng
--    - Password: Lecturer123!
--    - Check "Auto Confirm User"
--
-- 2. Copy the User UID from the created user
--
-- 3. Run this SQL (replace YOUR_USER_ID with the actual UUID):
--
-- INSERT INTO public.users (id, email, first_name, last_name, role, title, staff_id, department)
-- VALUES (
--     'YOUR_USER_ID',
--     'ogunsanwo@tasued.edu.ng',
--     'Ganiyu',
--     'Ogunsanwo',
--     'lecturer',
--     'Dr.',
--     'STF/CSC/001',
--     'Computer Science'
-- );
--
-- UPDATE public.courses SET lecturer_id = 'YOUR_USER_ID' WHERE code IN ('CSC 415', 'CSC 412');
-- =====================================================
