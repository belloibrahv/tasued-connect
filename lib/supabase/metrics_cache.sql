-- DYNAMIC METRICS CACHE (DMC)
-- Optimized for lighting-fast dashboard loads without table scans.

-- 1. Create metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id TEXT PRIMARY KEY,
  value BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize metrics
INSERT INTO public.system_metrics (id, value) VALUES 
('total_users', 0),
('total_students', 0),
('total_lecturers', 0),
('total_courses', 0),
('total_sessions', 0),
('active_sessions', 0)
ON CONFLICT DO NOTHING;

-- 2. Create trigger function to update metrics
CREATE OR REPLACE FUNCTION public.sync_system_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle USERS
  IF (TG_TABLE_NAME = 'users') THEN
    IF (TG_OP = 'INSERT') THEN
      UPDATE public.system_metrics SET value = value + 1 WHERE id = 'total_users';
      IF (NEW.role = 'student') THEN UPDATE public.system_metrics SET value = value + 1 WHERE id = 'total_students'; END IF;
      IF (NEW.role = 'lecturer') THEN UPDATE public.system_metrics SET value = value + 1 WHERE id = 'total_lecturers'; END IF;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE public.system_metrics SET value = value - 1 WHERE id = 'total_users';
      IF (OLD.role = 'student') THEN UPDATE public.system_metrics SET value = value - 1 WHERE id = 'total_students'; END IF;
      IF (OLD.role = 'lecturer') THEN UPDATE public.system_metrics SET value = value - 1 WHERE id = 'total_lecturers'; END IF;
    END IF;

  -- Handle COURSES
  ELSIF (TG_TABLE_NAME = 'courses') THEN
    IF (TG_OP = 'INSERT') THEN UPDATE public.system_metrics SET value = value + 1 WHERE id = 'total_courses';
    ELSIF (TG_OP = 'DELETE') THEN UPDATE public.system_metrics SET value = value - 1 WHERE id = 'total_courses';
    END IF;

  -- Handle SESSIONS
  ELSIF (TG_TABLE_NAME = 'lecture_sessions') THEN
    IF (TG_OP = 'INSERT') THEN 
      UPDATE public.system_metrics SET value = value + 1 WHERE id = 'total_sessions';
      IF (NEW.status = 'active') THEN UPDATE public.system_metrics SET value = value + 1 WHERE id = 'active_sessions'; END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
      IF (NEW.status = 'active' AND OLD.status != 'active') THEN UPDATE public.system_metrics SET value = value + 1 WHERE id = 'active_sessions';
      ELSIF (NEW.status != 'active' AND OLD.status = 'active') THEN UPDATE public.system_metrics SET value = value - 1 WHERE id = 'active_sessions';
      END IF;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE public.system_metrics SET value = value - 1 WHERE id = 'total_sessions';
      IF (OLD.status = 'active') THEN UPDATE public.system_metrics SET value = value - 1 WHERE id = 'active_sessions'; END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind triggers
CREATE TRIGGER tr_sync_users_metrics AFTER INSERT OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.sync_system_metrics();
CREATE TRIGGER tr_sync_courses_metrics AFTER INSERT OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.sync_system_metrics();
CREATE TRIGGER tr_sync_sessions_metrics AFTER INSERT OR UPDATE OR DELETE ON public.lecture_sessions FOR EACH ROW EXECUTE FUNCTION public.sync_system_metrics();

-- Initial sync (Run this once to populate existing counts)
UPDATE public.system_metrics SET value = (SELECT count(*) FROM public.users) WHERE id = 'total_users';
UPDATE public.system_metrics SET value = (SELECT count(*) FROM public.users WHERE role = 'student') WHERE id = 'total_students';
UPDATE public.system_metrics SET value = (SELECT count(*) FROM public.users WHERE role = 'lecturer') WHERE id = 'total_lecturers';
UPDATE public.system_metrics SET value = (SELECT count(*) FROM public.courses) WHERE id = 'total_courses';
UPDATE public.system_metrics SET value = (SELECT count(*) FROM public.lecture_sessions) WHERE id = 'total_sessions';
UPDATE public.system_metrics SET value = (SELECT count(*) FROM public.lecture_sessions WHERE status = 'active') WHERE id = 'active_sessions';
