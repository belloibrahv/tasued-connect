-- Migration: Automatic Attendance Percentage Updates
-- This creates triggers to automatically update attendance statistics
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FUNCTION: Update Attendance Percentage
-- ============================================

-- Function to recalculate attendance percentage when a record is inserted
CREATE OR REPLACE FUNCTION update_attendance_percentage()
RETURNS TRIGGER AS $$
DECLARE
  v_classes_attended INTEGER;
  v_total_classes INTEGER;
  v_percentage NUMERIC(5,2);
BEGIN
  -- Count classes attended for this student in this course
  SELECT COUNT(*) INTO v_classes_attended
  FROM attendance_records 
  WHERE student_id = NEW.student_id 
    AND course_id = NEW.course_id 
    AND status = 'present';
  
  -- Get total classes from enrollment record
  SELECT total_classes INTO v_total_classes
  FROM course_enrollments
  WHERE student_id = NEW.student_id 
    AND course_id = NEW.course_id;
  
  -- Calculate percentage (handle division by zero)
  IF v_total_classes > 0 THEN
    v_percentage := ROUND((v_classes_attended::NUMERIC / v_total_classes) * 100, 2);
  ELSE
    v_percentage := 0;
  END IF;
  
  -- Update the enrollment record
  UPDATE course_enrollments
  SET 
    classes_attended = v_classes_attended,
    attendance_percentage = v_percentage,
    updated_at = NOW()
  WHERE student_id = NEW.student_id 
    AND course_id = NEW.course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. TRIGGER: On Attendance Record Insert
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_attendance_percentage ON attendance_records;

-- Create trigger to fire after attendance record is inserted
CREATE TRIGGER trigger_update_attendance_percentage
AFTER INSERT ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_attendance_percentage();

-- ============================================
-- 3. FUNCTION: Increment Total Classes on Session Close
-- ============================================

-- Function to increment total_classes for all enrolled students when session closes
CREATE OR REPLACE FUNCTION increment_total_classes_on_session_close()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'closed'
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
    -- Increment total_classes for all students enrolled in this course
    UPDATE course_enrollments
    SET 
      total_classes = total_classes + 1,
      updated_at = NOW()
    WHERE course_id = NEW.course_id
      AND status = 'active';
    
    -- Recalculate attendance percentage for all enrolled students
    UPDATE course_enrollments ce
    SET 
      attendance_percentage = CASE 
        WHEN ce.total_classes > 0 THEN 
          ROUND((ce.classes_attended::NUMERIC / ce.total_classes) * 100, 2)
        ELSE 0
      END,
      updated_at = NOW()
    WHERE ce.course_id = NEW.course_id
      AND ce.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER: On Session Status Update
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_increment_total_classes ON lecture_sessions;

-- Create trigger to fire after session status is updated
CREATE TRIGGER trigger_increment_total_classes
AFTER UPDATE ON lecture_sessions
FOR EACH ROW
EXECUTE FUNCTION increment_total_classes_on_session_close();

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Verify triggers were created:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public';

-- Verify functions were created:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_type = 'FUNCTION'
-- AND routine_name LIKE '%attendance%' OR routine_name LIKE '%total_classes%';

-- ============================================
-- 6. MANUAL RECALCULATION (Optional)
-- ============================================

-- If you need to recalculate all attendance percentages manually:
-- UPDATE course_enrollments ce
-- SET 
--   classes_attended = (
--     SELECT COUNT(*) FROM attendance_records ar 
--     WHERE ar.student_id = ce.student_id 
--     AND ar.course_id = ce.course_id 
--     AND ar.status = 'present'
--   ),
--   attendance_percentage = CASE 
--     WHEN ce.total_classes > 0 THEN 
--       ROUND((
--         (SELECT COUNT(*) FROM attendance_records ar 
--          WHERE ar.student_id = ce.student_id 
--          AND ar.course_id = ce.course_id 
--          AND ar.status = 'present')::NUMERIC / ce.total_classes
--       ) * 100, 2)
--     ELSE 0
--   END,
--   updated_at = NOW();
