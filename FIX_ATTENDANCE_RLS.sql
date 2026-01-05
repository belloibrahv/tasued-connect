-- Fix RLS policy for students to insert attendance records
-- This allows students to mark their own attendance

-- Drop the old SELECT-only policy
DROP POLICY IF EXISTS "Students can view own attendance" ON attendance_records;

-- Create new SELECT policy for students
CREATE POLICY "Students can view own attendance" ON attendance_records
FOR SELECT TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student' 
  AND student_id = auth.uid()
);

-- Create INSERT policy for students to mark their own attendance
CREATE POLICY "Students can insert own attendance" ON attendance_records
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'student' 
  AND student_id = auth.uid()
);
