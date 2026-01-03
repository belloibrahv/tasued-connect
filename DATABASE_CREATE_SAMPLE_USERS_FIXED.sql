-- Create Sample Users for TASUED Connect Application (Fixed Version)
-- This script creates an admin, a lecturer, and a student user using proper UUID generation

-- 1. CREATE ADMIN USER
-- Using gen_random_uuid() to generate proper UUIDs
INSERT INTO public.users (id, email, first_name, last_name, other_names, role, is_active, is_email_verified)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'admin@tasued.edu.ng',
  'System',
  'Administrator',
  NULL,
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

-- 2. CREATE LECTURER USER
INSERT INTO public.users (id, email, first_name, last_name, other_names, role, staff_id, department, title, is_active, is_email_verified)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'john.doe@tasued.edu.ng',
  'John',
  'Doe',
  NULL,
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

-- 3. CREATE STUDENT USER
INSERT INTO public.users (id, email, first_name, last_name, other_names, role, matric_number, level, is_active, is_email_verified)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'jane.smith@stu.tasued.edu.ng',
  'Jane',
  'Smith',
  NULL,
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

-- 4. CREATE ADDITIONAL LECTURER FOR TESTING
INSERT INTO public.users (id, email, first_name, last_name, other_names, role, staff_id, department, title, is_active, is_email_verified)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'mary.johnson@tasued.edu.ng',
  'Mary',
  'Johnson',
  NULL,
  'lecturer',
  'TAS/CS/002',
  'Computer Science',
  'Prof.',
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

-- 5. CREATE ADDITIONAL STUDENTS FOR TESTING
INSERT INTO public.users (id, email, first_name, last_name, other_names, role, matric_number, level, is_active, is_email_verified)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'bob.williams@stu.tasued.edu.ng',
  'Bob',
  'Williams',
  NULL,
  'student',
  'CSC/20/002',
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

INSERT INTO public.users (id, email, first_name, last_name, other_names, role, matric_number, level, is_active, is_email_verified)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'alice.brown@stu.tasued.edu.ng',
  'Alice',
  'Brown',
  NULL,
  'student',
  'CSC/20/003',
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

-- 6. CREATE SAMPLE COURSE TAUGHT BY THE LECTURER
-- First, get the lecturer ID and create a course
INSERT INTO courses (id, code, name, description, lecturer_id, department, level, semester, year, is_active)
VALUES (
  gen_random_uuid(),
  'CSC201',
  'Introduction to Programming',
  'Basic programming concepts using Python',
  (SELECT id FROM users WHERE email = 'john.doe@tasued.edu.ng' LIMIT 1),  -- Get John Doe's ID
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

-- 7. ENROLL STUDENTS IN THE COURSE
-- Enroll Jane Smith (student)
INSERT INTO course_enrollments (course_id, student_id, status)
SELECT 
  (SELECT id FROM courses WHERE code = 'CSC201' LIMIT 1),
  (SELECT id FROM users WHERE email = 'jane.smith@stu.tasued.edu.ng' LIMIT 1),  -- Jane Smith's ID
  'active'
ON CONFLICT (course_id, student_id) DO NOTHING;

-- Enroll Bob Williams (student)
INSERT INTO course_enrollments (course_id, student_id, status)
SELECT 
  (SELECT id FROM courses WHERE code = 'CSC201' LIMIT 1),
  (SELECT id FROM users WHERE email = 'bob.williams@stu.tasued.edu.ng' LIMIT 1),  -- Bob Williams' ID
  'active'
ON CONFLICT (course_id, student_id) DO NOTHING;

-- Enroll Alice Brown (student)
INSERT INTO course_enrollments (course_id, student_id, status)
SELECT 
  (SELECT id FROM courses WHERE code = 'CSC201' LIMIT 1),
  (SELECT id FROM users WHERE email = 'alice.brown@stu.tasued.edu.ng' LIMIT 1),  -- Alice Brown's ID
  'active'
ON CONFLICT (course_id, student_id) DO NOTHING;

-- 8. CREATE A SAMPLE LECTURE SESSION
INSERT INTO lecture_sessions (id, course_id, lecturer_id, session_date, start_time, end_time, location, session_code, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM courses WHERE code = 'CSC201' LIMIT 1),
  (SELECT id FROM users WHERE email = 'john.doe@tasued.edu.ng' LIMIT 1),  -- John Doe's ID
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

-- 9. VERIFY CREATION
/*
SELECT 
    'Users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Courses' as table_name,
    COUNT(*) as count
FROM courses
UNION ALL
SELECT 
    'Enrollments' as table_name,
    COUNT(*) as count
FROM course_enrollments
UNION ALL
SELECT 
    'Sessions' as table_name,
    COUNT(*) as count
FROM lecture_sessions
UNION ALL
SELECT 
    'Attendance' as table_name,
    COUNT(*) as count
FROM attendance_records;
*/

-- 10. DISPLAY THE CREATED USERS
/*
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    matric_number,
    staff_id,
    department,
    level,
    title,
    is_active,
    is_email_verified,
    created_at
FROM users
ORDER BY role, last_name, first_name;
*/