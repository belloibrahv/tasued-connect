-- Corrected Database Scripts for TASUED Connect

-- 1. CORRECTED SAMPLE DATA INSERTION (Fixing table name typo)
-- This version fixes the table name from 'lecture_session' to 'lecture_sessions'

-- Create ADMIN user
INSERT INTO public.users (id, email, first_name, last_name, role, is_active, is_email_verified)
VALUES (
  '11111111-1111-1111-1111-111111111111',  -- Sample UUID
  'admin@tasued.edu.ng',
  'System',
  'Administrator',
  'admin',
  TRUE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  is_email_verified = EXCLUDED.is_email_verified,
  updated_at = NOW();

-- Create LECTURER user
INSERT INTO public.users (id, email, first_name, last_name, role, staff_id, department, title, is_active, is_email_verified)
VALUES (
  '22222222-2222-2222-2222-222222222222',  -- Sample UUID
  'john.doe@tasued.edu.ng',
  'John',
  'Doe',
  'lecturer',
  'TAS/CS/001',
  'Computer Science',
  'Dr.',
  TRUE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  staff_id = EXCLUDED.staff_id,
  department = EXCLUDED.department,
  title = EXCLUDED.title,
  is_active = EXCLUDED.is_active,
  is_email_verified = EXCLUDED.is_email_verified,
  updated_at = NOW();

-- Create STUDENT user
INSERT INTO public.users (id, email, first_name, last_name, role, matric_number, level, is_active, is_email_verified)
VALUES (
  '33333333-3333-3333-3333-333333333333',  -- Sample UUID
  'jane.smith@stu.tasued.edu.ng',
  'Jane',
  'Smith',
  'student',
  'CSC/20/001',
  '200',
  TRUE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  matric_number = EXCLUDED.matric_number,
  level = EXCLUDED.level,
  is_active = EXCLUDED.is_active,
  is_email_verified = EXCLUDED.is_email_verified,
  updated_at = NOW();

-- Create sample course
INSERT INTO courses (id, code, name, description, lecturer_id, department, level, semester, year, is_active)
VALUES (
  gen_random_uuid(),
  'CSC201',
  'Introduction to Programming',
  'Basic programming concepts using Python',
  '22222222-2222-2222-2222-222222222222',  -- John Doe's ID
  'Computer Science',
  '200',
  'Harmattan',
  2024,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  lecturer_id = EXCLUDED.lecturer_id,
  department = EXCLUDED.department,
  level = EXCLUDED.level,
  semester = EXCLUDED.semester,
  year = EXCLUDED.year,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Enroll student in the course
INSERT INTO course_enrollments (course_id, student_id, status)
SELECT 
  (SELECT id FROM courses WHERE code = 'CSC201'),
  '33333333-3333-3333-3333-333333333333',  -- Jane Smith's ID
  'active'
ON CONFLICT (course_id, student_id) DO NOTHING;

-- Create a sample lecture session
INSERT INTO lecture_sessions (id, course_id, lecturer_id, session_date, start_time, end_time, location, session_code, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM courses WHERE code = 'CSC201'),
  '22222222-2222-2222-2222-222222222222',  -- John Doe's ID
  CURRENT_DATE,
  '09:00:00',
  '11:00:00',
  'Computer Science Lab 1',
  'CSC201-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0'),
  'active'
)
ON CONFLICT (session_code) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  lecturer_id = EXCLUDED.lecturer_id,
  session_date = EXCLUDED.session_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. FIX FOR REGISTRATION ISSUES
-- The registration error might be due to missing constraints or triggers.
-- Here's a comprehensive fix for the registration process:

-- Ensure the users table has proper primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_pkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure the auth trigger is properly set up
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, matric_number, staff_id, department, level, title, is_active, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'matric_number', NULL),
    COALESCE(NEW.raw_user_meta_data->>'staff_id', NULL),
    COALESCE(NEW.raw_user_meta_data->>'department', NULL),
    COALESCE(NEW.raw_user_meta_data->>'level', NULL),
    COALESCE(NEW.raw_user_meta_data->>'title', NULL),
    TRUE,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, matric_number, staff_id, department, level, title, is_active, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'matric_number', NULL),
    COALESCE(NEW.raw_user_meta_data->>'staff_id', NULL),
    COALESCE(NEW.raw_user_meta_data->>'department', NULL),
    COALESCE(NEW.raw_user_meta_data->>'level', NULL),
    COALESCE(NEW.raw_user_meta_data->>'title', NULL),
    TRUE,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    matric_number = EXCLUDED.matric_number,
    staff_id = EXCLUDED.staff_id,
    department = EXCLUDED.department,
    level = EXCLUDED.level,
    title = EXCLUDED.title,
    is_email_verified = EXCLUDED.is_email_verified,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create update trigger
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- Grant necessary permissions to service role
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_updated TO service_role;

-- 3. ADD PROPER INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_id_role ON users(id, role);
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance_records(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_lecturer_status ON lecture_sessions(lecturer_id, status);
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_course_id ON lecture_sessions(course_id);

-- 4. ADD FACE RECOGNITION COLUMNS IF NOT EXISTS
-- These are critical for the face recognition functionality
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS face_descriptor REAL[];

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN users.face_descriptor IS '128-dimensional face embedding vector stored as array for face recognition';
COMMENT ON COLUMN users.profile_photo_url IS 'URL of the enrolled face photo stored in Supabase storage';

-- 5. VERIFY THE TABLE STRUCTURE
/*
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'courses', 'course_enrollments', 'lecture_sessions', 'attendance_records')
ORDER BY table_name, ordinal_position;
*/