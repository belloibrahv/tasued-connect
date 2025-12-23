-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Students, Lecturers, Admins)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin', 'hod')),
  
  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  other_names TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  profile_photo_url TEXT,
  bio TEXT,
  
  -- Academic Info (for students)
  matric_number TEXT UNIQUE,
  department TEXT,
  level TEXT CHECK (level IN ('100', '200', '300', '400', '500', 'PG')),
  
  -- Staff Info (for lecturers)
  staff_id TEXT UNIQUE,
  title TEXT,
  office_location TEXT,
  
  -- Face Recognition
  face_descriptor JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT check_student_fields CHECK (
    (role = 'student' AND matric_number IS NOT NULL) OR
    (role != 'student')
  ),
  CONSTRAINT check_lecturer_fields CHECK (
    (role = 'lecturer' AND staff_id IS NOT NULL) OR
    (role != 'lecturer')
  )
);

-- COURSES TABLE
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  credits INT DEFAULT 3,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  
  -- Lecturer
  lecturer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Schedule
  schedule JSONB,
  
  -- Settings
  min_attendance_percentage INT DEFAULT 75,
  max_students INT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COURSE_ENROLLMENTS TABLE
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Enrollment info
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  
  -- Performance
  attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
  classes_attended INT DEFAULT 0,
  total_classes INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(course_id, student_id)
);

-- LECTURE_SESSIONS TABLE
CREATE TABLE public.lecture_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Session details
  topic TEXT,
  venue TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  duration_minutes INT,
  
  -- Attendance code
  attendance_code TEXT UNIQUE NOT NULL,
  code_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'closed', 'cancelled')),
  
  -- Stats
  total_enrolled INT DEFAULT 0,
  total_present INT DEFAULT 0,
  total_absent INT DEFAULT 0,
  total_late INT DEFAULT 0,
  attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- ATTENDANCE_RECORDS TABLE
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.lecture_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  
  -- Attendance details
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  marking_method TEXT DEFAULT 'qr' CHECK (marking_method IN ('qr', 'manual', 'system', 'face')),
  
  -- Additional info
  check_in_time TIME,
  minutes_late INT DEFAULT 0,
  excuse_reason TEXT,
  excuse_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  excuse_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, student_id)
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN ('attendance', 'alert', 'reminder', 'system', 'achievement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACHIEVEMENTS TABLE
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Achievement details
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- Context
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB
);

-- ATTENDANCE_EXCUSES TABLE
CREATE TABLE public.attendance_excuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Excuse details
  reason TEXT NOT NULL,
  supporting_document_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SYSTEM_SETTINGS TABLE
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT_LOGS TABLE
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  
  -- Details
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_matric ON public.users(matric_number);
CREATE INDEX idx_courses_code ON public.courses(code);
CREATE INDEX idx_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX idx_sessions_course ON public.lecture_sessions(course_id);
CREATE INDEX idx_attendance_session ON public.attendance_records(session_id);
CREATE INDEX idx_attendance_student ON public.attendance_records(student_id);

-- RLS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- USERS: Users can read their own profile, admins can read all
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'hod')
  )
);
CREATE POLICY "Service can insert users" ON public.users FOR INSERT WITH CHECK (true);

-- COURSES: Everyone can view, but only admins/lecturers should manage (unrestricted for dev)
CREATE POLICY "Allow public read for courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow public insert for courses" ON public.courses FOR INSERT WITH CHECK (true);

-- ENROLLMENTS: Students see theirs, lecturers see their course enrollments
CREATE POLICY "Allow read enrollments" ON public.course_enrollments FOR SELECT USING (true);
CREATE POLICY "Allow insert enrollments" ON public.course_enrollments FOR INSERT WITH CHECK (true);

-- SESSIONS: Everyone can see, lecturers manage
CREATE POLICY "Allow read sessions" ON public.lecture_sessions FOR SELECT USING (true);
CREATE POLICY "Allow insert sessions" ON public.lecture_sessions FOR INSERT WITH CHECK (true);

-- ATTENDANCE: Students see theirs, marked via scanner
CREATE POLICY "Allow read attendance" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);

-- FUNCTIONS & TRIGGERS

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    role, 
    first_name, 
    last_name, 
    matric_number, 
    staff_id, 
    department, 
    level, 
    phone_number
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'matric_number',
    new.raw_user_meta_data->>'staff_id',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'level',
    new.raw_user_meta_data->>'phone_number'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
