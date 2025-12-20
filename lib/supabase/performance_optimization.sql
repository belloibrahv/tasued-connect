-- HIGH-PERFORMANCE SCALABILITY OPTIMIZATIONS
-- This script adds critical indexes and triggers to handle thousands of concurrent users.

-- 1. ADVANCED INDEXING FOR HIGH-CONCURRENCY
-- Speed up the live check-in feed (most frequent query during sessions)
CREATE INDEX IF NOT EXISTS idx_attendance_session_marked_at ON public.attendance_records(session_id, marked_at DESC);

-- Speed up course-level analytics and reports
CREATE INDEX IF NOT EXISTS idx_attendance_course ON public.attendance_records(course_id);

-- Speed up frequent role-based filtered lookups (Admin/HOD dashboards)
CREATE INDEX IF NOT EXISTS idx_users_role_dept ON public.users(role, department);

-- 2. AUTOMATED STATISTICAL TRIGGERS (Performance & Data Integrity)
-- This replaces expensive client-side calculations with atomic DB-level updates.

-- Function to update enrollment stats when attendance is recorded
CREATE OR REPLACE FUNCTION public.update_enrollment_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update course_enrollments (increment classes/percentage)
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.course_enrollments
    SET 
      classes_attended = (SELECT count(*) FROM public.attendance_records WHERE course_id = NEW.course_id AND student_id = NEW.student_id AND status = 'present'),
      total_classes = (SELECT count(*) FROM public.lecture_sessions WHERE course_id = NEW.course_id AND status = 'closed'),
      updated_at = NOW()
    WHERE course_id = NEW.course_id AND student_id = NEW.student_id;
    
    -- Update lecture_sessions (increment present count)
    UPDATE public.lecture_sessions
    SET 
      total_present = (SELECT count(*) FROM public.attendance_records WHERE session_id = NEW.session_id AND status = 'present'),
      updated_at = NOW()
    WHERE id = NEW.session_id;

  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.course_enrollments
    SET 
      classes_attended = (SELECT count(*) FROM public.attendance_records WHERE course_id = OLD.course_id AND student_id = OLD.student_id AND status = 'present'),
      updated_at = NOW()
    WHERE course_id = OLD.course_id AND student_id = OLD.student_id;
    
    UPDATE public.lecture_sessions
    SET 
      total_present = (SELECT count(*) FROM public.attendance_records WHERE session_id = OLD.session_id AND status = 'present'),
      updated_at = NOW()
    WHERE id = OLD.session_id;
  END IF;

  -- Re-calculate percentage
  UPDATE public.course_enrollments
  SET attendance_percentage = CASE WHEN total_classes > 0 THEN (classes_attended::DECIMAL / total_classes) * 100 ELSE 0 END
  WHERE (course_id = COALESCE(NEW.course_id, OLD.course_id)) AND (student_id = COALESCE(NEW.student_id, OLD.student_id));

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for attendance records
DROP TRIGGER IF EXISTS tr_update_stats_on_attendance ON public.attendance_records;
CREATE TRIGGER tr_update_stats_on_attendance
AFTER INSERT OR DELETE ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_stats();

-- Function to handle session closure and update total_classes in enrollments
CREATE OR REPLACE FUNCTION public.update_enrollments_on_session_close()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'closed' AND OLD.status != 'closed') THEN
    UPDATE public.course_enrollments
    SET 
      total_classes = total_classes + 1,
      updated_at = NOW()
    WHERE course_id = NEW.course_id;
    
    -- Recalculate percentages for everyone in that course
    UPDATE public.course_enrollments
    SET attendance_percentage = CASE WHEN total_classes > 0 THEN (classes_attended::DECIMAL / total_classes) * 100 ELSE 0 END
    WHERE course_id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for session status changes
DROP TRIGGER IF EXISTS tr_session_closure_sync ON public.lecture_sessions;
CREATE TRIGGER tr_session_closure_sync
AFTER UPDATE ON public.lecture_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_enrollments_on_session_close();

-- 3. REALTIME PUBLICATION OPTIMIZATION
-- Ensure the key tables are prepared for high-velocity replication
ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;
ALTER TABLE public.lecture_sessions REPLICA IDENTITY FULL;
