-- Final RLS Fix for lecture_sessions
-- This allows lecturers to view their own sessions regardless of status

-- Drop all existing policies on lecture_sessions
DROP POLICY IF EXISTS "Lecturers can manage own sessions" ON lecture_sessions;
DROP POLICY IF EXISTS "Admin can manage all sessions" ON lecture_sessions;
DROP POLICY IF EXISTS "Everyone can view active sessions" ON lecture_sessions;

-- Policy 1: Lecturers can SELECT/INSERT/UPDATE/DELETE their own sessions (all statuses)
CREATE POLICY "Lecturers manage own sessions" ON lecture_sessions
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer' 
  AND lecturer_id = auth.uid()
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'lecturer' 
  AND lecturer_id = auth.uid()
);

-- Policy 2: Admin can SELECT/INSERT/UPDATE/DELETE all sessions
CREATE POLICY "Admin manage all sessions" ON lecture_sessions
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hod')
);

-- Policy 3: Students can only SELECT active sessions
CREATE POLICY "Students view active sessions" ON lecture_sessions
FOR SELECT TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student'
  AND status = 'active'
);

-- Policy 4: Anyone authenticated can view active sessions (fallback)
CREATE POLICY "Anyone view active sessions" ON lecture_sessions
FOR SELECT TO authenticated
USING (status = 'active');

-- Ensure RLS is enabled
ALTER TABLE lecture_sessions ENABLE ROW LEVEL SECURITY;
