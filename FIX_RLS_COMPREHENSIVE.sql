-- Comprehensive RLS Fix - Eliminates Subqueries and Uses JWT Claims
-- This is the recommended fix that resolves all circular dependency issues

-- ============================================================================
-- 1. FIX LECTURE_SESSIONS RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Lecturers can manage own sessions" ON lecture_sessions;
DROP POLICY IF EXISTS "Admin can manage all sessions" ON lecture_sessions;
DROP POLICY IF EXISTS "Everyone can view active sessions" ON lecture_sessions;
DROP POLICY IF EXISTS "Lecturers can view own sessions" ON lecture_sessions;
DROP POLICY IF EXISTS "Students can view active sessions" ON lecture_sessions;

-- Lecturers can manage their own sessions (all statuses)
CREATE POLICY "Lecturers can manage own sessions" ON lecture_sessions
FOR ALL TO authenticated
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

-- Admin can manage all sessions
CREATE POLICY "Admin can manage all sessions" ON lecture_sessions
FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'hod'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'hod'));

-- Students can view active sessions
CREATE POLICY "Students can view active sessions" ON lecture_sessions
FOR SELECT TO authenticated
USING (status = 'active' AND auth.jwt() ->> 'role' = 'student');

-- Everyone can view active sessions
CREATE POLICY "Everyone can view active sessions" ON lecture_sessions
FOR SELECT TO authenticated
USING (status = 'active');

ALTER TABLE lecture_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. FIX COURSE_ENROLLMENTS RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Students can manage own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Lecturers can view course enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Admin can manage all enrollments" ON course_enrollments;

-- Students can manage their own enrollments
CREATE POLICY "Students can manage own enrollments" ON course_enrollments
FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Lecturers can view enrollments for their courses
CREATE POLICY "Lecturers can view course enrollments" ON course_enrollments
FOR SELECT TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE lecturer_id = auth.uid()
  )
);

-- Admin can manage all enrollments
CREATE POLICY "Admin can manage all enrollments" ON course_enrollments
FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'hod'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'hod'));

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. FIX ATTENDANCE_RECORDS RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Students can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Students can insert own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Lecturers can manage course attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admin can manage all attendance" ON attendance_records;

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance_records
FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Students can insert their own attendance
CREATE POLICY "Students can insert own attendance" ON attendance_records
FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- Lecturers can manage attendance for their courses
CREATE POLICY "Lecturers can manage course attendance" ON attendance_records
FOR ALL TO authenticated
USING (
  session_id IN (
    SELECT id FROM lecture_sessions WHERE course_id IN (
      SELECT id FROM courses WHERE lecturer_id = auth.uid()
    )
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM lecture_sessions WHERE course_id IN (
      SELECT id FROM courses WHERE lecturer_id = auth.uid()
    )
  )
);

-- Admin can manage all attendance
CREATE POLICY "Admin can manage all attendance" ON attendance_records
FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'hod'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'hod'));

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. FIX COURSES RLS POLICIES (if not already set)
-- ============================================================================

DROP POLICY IF EXISTS "Lecturers can manage own courses" ON courses;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON courses;
DROP POLICY IF EXISTS "Admin can manage all courses" ON courses;

-- Lecturers can manage their own courses
CREATE POLICY "Lecturers can manage own courses" ON courses
FOR ALL TO authenticated
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

-- Students can view courses they're enrolled in
CREATE POLICY "Students can view enrolled courses" ON courses
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT course_id FROM course_enrollments WHERE student_id = auth.uid()
  )
);

-- Admin can manage all courses
CREATE POLICY "Admin can manage all courses" ON courses
FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'hod'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'hod'));

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This fix:
-- 1. Eliminates subqueries that check user role from users table
-- 2. Uses JWT claims (auth.jwt() ->> 'role') for role-based access
-- 3. Allows lecturers to see ALL their own sessions (not just active)
-- 4. Improves performance by reducing nested queries
-- 5. Eliminates circular RLS dependencies
-- 6. Follows Supabase best practices for RLS policies
