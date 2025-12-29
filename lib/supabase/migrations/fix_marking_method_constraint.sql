-- Fix marking_method constraint to include 'face' option
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE public.attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_marking_method_check;

-- Add new constraint that includes 'face' as a valid marking method
ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_records_marking_method_check 
CHECK (marking_method IN ('qr', 'manual', 'system', 'face'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.attendance_records'::regclass 
AND contype = 'c';
