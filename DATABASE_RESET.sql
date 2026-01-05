-- Complete Database Reset and Setup Script
-- This script drops all existing tables and recreates them with proper structure

-- 1. DROP EXISTING TABLES (if they exist)
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS lecture_sessions CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE USERS TABLE (extends auth.users)
-- This table stores extended user profile information
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  matric_number TEXT UNIQUE,
  staff_id TEXT UNIQUE,
  department TEXT,
  level TEXT,
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  face_descriptor REAL[],
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_matric_number ON users(matric_number) WHERE matric_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id) WHERE staff_id IS NOT NULL;

-- Add comment to document the face_descriptor column
COMMENT ON COLUMN users.face_descriptor IS '128-dimensional face embedding vector stored as array for face recognition';

-- Add comment to document the profile_photo_url column
COMMENT ON COLUMN users.profile_photo_url IS 'URL of the enrolled face photo stored in Supabase storage';

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update the timestamp on row updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. CREATE COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department TEXT,
  level TEXT,
  semester TEXT,
  year INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- 4. CREATE COURSE ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'dropped', 'completed'
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, student_id) -- Prevent duplicate enrollments
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

-- 5. CREATE LECTURE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS lecture_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  session_code TEXT UNIQUE, -- QR code or session identifier
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_lecturer_id ON lecture_sessions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_course_id ON lecture_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_date ON lecture_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_code ON lecture_sessions(session_code);

-- 6. CREATE ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES lecture_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marking_method TEXT DEFAULT 'qr', -- 'qr', 'manual', 'system', 'face'
  is_present BOOLEAN DEFAULT TRUE,
  location_lat DECIMAL(8,6), -- Latitude for geolocation
  location_lng DECIMAL(9,6), -- Longitude for geolocation
  face_verification_data JSONB, -- Additional face verification data if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id) -- Prevent duplicate attendance for same session
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance_records(created_at);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 8. CREATE RLS POLICIES FOR USERS TABLE
-- Policy for authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy for authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Policy for authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for service role to manage all profiles
CREATE POLICY "Service role can manage all profiles" ON users
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Policy for authenticated users to update their face data
CREATE POLICY "Users can update face data" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 9. CREATE RLS POLICIES FOR COURSES TABLE
-- Policy for lecturers to manage their own courses
CREATE POLICY "Lecturers can manage own courses" ON courses
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer' 
  AND lecturer_id = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer' 
  AND lecturer_id = auth.uid()
);

-- Policy for admin/HOD to manage all courses
CREATE POLICY "Admin can manage all courses" ON courses
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
);

-- Policy for everyone to view active courses
CREATE POLICY "Everyone can view active courses" ON courses
FOR SELECT TO authenticated
USING (is_active = true);

-- 10. CREATE RLS POLICIES FOR COURSE ENROLLMENTS TABLE
-- Policy for students to manage their own enrollments
CREATE POLICY "Students can manage own enrollments" ON course_enrollments
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student' 
  AND student_id = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student' 
  AND student_id = auth.uid()
);

-- Policy for lecturers to view enrollments for their courses
CREATE POLICY "Lecturers can view course enrollments" ON course_enrollments
FOR SELECT TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer'
  AND course_id IN (
    SELECT id FROM courses WHERE lecturer_id = auth.uid()
  )
);

-- Policy for admin to manage all enrollments
CREATE POLICY "Admin can manage all enrollments" ON course_enrollments
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
);

-- 11. CREATE RLS POLICIES FOR LECTURE SESSIONS TABLE
-- Policy for lecturers to manage their own sessions
CREATE POLICY "Lecturers can manage own sessions" ON lecture_sessions
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer' 
  AND lecturer_id = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer' 
  AND lecturer_id = auth.uid()
);

-- Policy for admin to manage all sessions
CREATE POLICY "Admin can manage all sessions" ON lecture_sessions
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
);

-- Policy for everyone to view active sessions
CREATE POLICY "Everyone can view active sessions" ON lecture_sessions
FOR SELECT TO authenticated
USING (status = 'active');

-- 12. CREATE RLS POLICIES FOR ATTENDANCE RECORDS TABLE
-- Policy for students to view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance_records
FOR SELECT TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student' 
  AND student_id = auth.uid()
);

-- Policy for students to insert their own attendance records
CREATE POLICY "Students can insert own attendance" ON attendance_records
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student' 
  AND student_id = auth.uid()
);

-- Policy for lecturers to manage attendance for their courses
CREATE POLICY "Lecturers can manage course attendance" ON attendance_records
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer'
  AND session_id IN (
    SELECT id FROM lecture_sessions WHERE course_id IN (
      SELECT id FROM courses WHERE lecturer_id = auth.uid()
    )
  )
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer'
  AND session_id IN (
    SELECT id FROM lecture_sessions WHERE course_id IN (
      SELECT id FROM courses WHERE lecturer_id = auth.uid()
    )
  )
);

-- Policy for admin to manage all attendance
CREATE POLICY "Admin can manage all attendance" ON attendance_records
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
);

-- 13. GRANT NECESSARY PERMISSIONS
GRANT ALL PRIVILEGES ON TABLE users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE courses TO authenticated;
GRANT ALL PRIVILEGES ON TABLE course_enrollments TO authenticated;
GRANT ALL PRIVILEGES ON TABLE lecture_sessions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE attendance_records TO authenticated;

GRANT ALL PRIVILEGES ON TABLE users TO service_role;
GRANT ALL PRIVILEGES ON TABLE courses TO service_role;
GRANT ALL PRIVILEGES ON TABLE course_enrollments TO service_role;
GRANT ALL PRIVILEGES ON TABLE lecture_sessions TO service_role;
GRANT ALL PRIVILEGES ON TABLE attendance_records TO service_role;

-- 14. CREATE DATABASE TRIGGERS FOR AUTO-USER CREATION
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, is_active, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
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
  -- Update the user profile if it exists
  INSERT INTO public.users (id, email, first_name, last_name, role, is_active, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    TRUE,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
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

-- 15. VERIFY TABLE CREATION
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