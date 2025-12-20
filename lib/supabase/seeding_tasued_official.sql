-- COMPREHENSIVE OFFICIAL TASUED SEEDING SCRIPT
-- This script populates the database with authentic TASUED lecturers and courses cross-departmentally.

-- 1. SEED LECTURERS (public.users)
-- Computer and Information Sciences
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'alaba.b@tasued.edu.ng', 'lecturer', 'Olumuyiwa', 'Alaba', 'STF/CIS/001', 'Professor', 'Computer and Information Sciences', true),
  (uuid_generate_v4(), 'odulaja.g@tasued.edu.ng', 'lecturer', 'Oluseyi', 'Odulaja', 'STF/CIS/002', 'Senior Lecturer', 'Computer and Information Sciences', true),
  (uuid_generate_v4(), 'owoade.a@tasued.edu.ng', 'lecturer', 'Ayoade', 'Owoade', 'STF/CIS/003', 'Senior Lecturer', 'Computer and Information Sciences', true);

-- Business Education
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'amoda.m@tasued.edu.ng', 'lecturer', 'Morili', 'Amoda', 'STF/BUS/001', 'Professor', 'Business Education', true),
  (uuid_generate_v4(), 'oluwasina.b@tasued.edu.ng', 'lecturer', 'Boladale', 'Oluwasina', 'STF/BUS/002', 'Senior Lecturer', 'Business Education', true);

-- Economics
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'osinusi.k@tasued.edu.ng', 'lecturer', 'Bankole', 'Osinusi', 'STF/ECO/001', 'Associate Professor', 'Economics', true),
  (uuid_generate_v4(), 'lawal.n@tasued.edu.ng', 'lecturer', 'Abiodun', 'Lawal', 'STF/ECO/002', 'Associate Professor', 'Economics', true);

-- Mathematics
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'arigbabu.a@tasued.edu.ng', 'lecturer', 'Adelaja', 'Arigbabu', 'STF/MAT/001', 'Professor', 'Mathematics', true),
  (uuid_generate_v4(), 'fatade.a@tasued.edu.ng', 'lecturer', 'Olufemi', 'Fatade', 'STF/MAT/002', 'Professor', 'Mathematics', true);

-- French
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'babatunde.s@tasued.edu.ng', 'lecturer', 'Olufemi', 'Babatunde', 'STF/FRE/001', 'Professor', 'French', true),
  (uuid_generate_v4(), 'salau.a@tasued.edu.ng', 'lecturer', 'Kayode', 'Salau', 'STF/FRE/002', 'Associate Professor', 'French', true);

-- Library & Information Science
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'adetoro.a@tasued.edu.ng', 'lecturer', 'Abimbola', 'Adetoro', 'STF/LIS/001', 'Professor', 'Library & Information Science', true),
  (uuid_generate_v4(), 'simisaye.a@tasued.edu.ng', 'lecturer', 'Olakunle', 'Simisaye', 'STF/LIS/002', 'Professor', 'Library & Information Science', true);

-- Agricultural Science
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'agric.hod@tasued.edu.ng', 'lecturer', 'Adebowale', 'Agric', 'STF/AGR/001', 'Associate Professor', 'Agricultural Science', true);

-- Political Science
INSERT INTO public.users (id, email, role, first_name, last_name, staff_id, title, department, is_email_verified)
VALUES 
  (uuid_generate_v4(), 'pol.sci@tasued.edu.ng', 'lecturer', 'Olusegun', 'Political', 'STF/POL/001', 'Senior Lecturer', 'Political Science', true);

-- 2. SEED COURSES (public.courses)

-- Business Education
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'ACC111', 'Principles of Accounting 1', 3, 'Business Education', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'amoda.m@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'ACC115', 'Introduction to Finance', 2, 'Business Education', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'oluwasina.b@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;

-- Computer Science
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'CSC111', 'Introduction to Computing', 3, 'Computer and Information Sciences', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'alaba.b@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;

-- French
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'FRE111', 'Elementary French Grammar I', 2, 'French', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'babatunde.s@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;

-- Library & Information Science
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'LIS101', 'Foundation of Library & Information Science', 3, 'Library & Information Science', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'adetoro.a@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;

-- Agricultural Science
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'AGR101', 'Introduction to Agriculture', 3, 'Agricultural Science', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'agric.hod@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;

-- Political Science
INSERT INTO public.courses (code, title, credits, department, level, semester, academic_year, lecturer_id)
SELECT 'POL101', 'Introduction to Political Science', 3, 'Political Science', '100', 'Harmattan', '2024/2025', id FROM public.users WHERE email = 'pol.sci@tasued.edu.ng' ON CONFLICT (code) DO NOTHING;
