-- Migration: Add Performance Indexes
-- These indexes improve query performance for frequently accessed columns
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ATTENDANCE RECORDS INDEXES
-- ============================================

-- Index for sorting attendance records by marked_at (used in dashboards and reports)
CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_at 
ON attendance_records(marked_at DESC);

-- Index for session-based attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id 
ON attendance_records(session_id);

-- Composite index for student attendance queries (used in course enrollment stats)
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_course 
ON attendance_records(student_id, course_id);

-- Index for course-based attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_course_id 
ON attendance_records(course_id);

-- ============================================
-- 2. LECTURE SESSIONS INDEXES
-- ============================================

-- Index for session code lookups (used when students enter attendance code)
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_attendance_code 
ON lecture_sessions(attendance_code);

-- Index for active sessions queries
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_status 
ON lecture_sessions(status);

-- Composite index for lecturer's sessions
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_lecturer_status 
ON lecture_sessions(lecturer_id, status);

-- ============================================
-- 3. COURSE ENROLLMENTS INDEXES
-- ============================================

-- Index for student's enrolled courses
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id 
ON course_enrollments(student_id);

-- Index for course's enrolled students
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id 
ON course_enrollments(course_id);

-- ============================================
-- 4. USERS INDEXES
-- ============================================

-- Index for role-based queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- ============================================
-- 5. VERIFICATION QUERY
-- ============================================

-- Run this to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
