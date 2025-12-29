-- Fix RLS policies for attendance_records table
-- Run this in Supabase SQL Editor if students can't mark attendance

-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can insert own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Lecturers can view course attendance" ON public.attendance_records;

-- Allow students to insert their own attendance records
CREATE POLICY "Students can insert own attendance"
ON public.attendance_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Allow students to view their own attendance records
CREATE POLICY "Students can view own attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Allow lecturers to view attendance for their courses
CREATE POLICY "Lecturers can view course attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND c.lecturer_id = auth.uid()
  )
);

-- Also ensure lecture_sessions has proper policies
ALTER TABLE public.lecture_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.lecture_sessions;
DROP POLICY IF EXISTS "Lecturers can manage own sessions" ON public.lecture_sessions;

-- Allow anyone to view active sessions (needed for students to verify codes)
CREATE POLICY "Anyone can view active sessions"
ON public.lecture_sessions FOR SELECT
TO authenticated
USING (true);

-- Allow lecturers to manage their own sessions
CREATE POLICY "Lecturers can manage own sessions"
ON public.lecture_sessions FOR ALL
TO authenticated
USING (auth.uid() = lecturer_id)
WITH CHECK (auth.uid() = lecturer_id);
