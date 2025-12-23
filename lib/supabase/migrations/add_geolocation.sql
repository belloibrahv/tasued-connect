-- Add geolocation fields to lecture_sessions table
-- This enables location-based attendance verification

-- Add location coordinates to sessions
ALTER TABLE public.lecture_sessions 
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_radius INT DEFAULT 100; -- Max distance in meters

-- Add location verification to attendance records
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS location_distance INT, -- Distance from class in meters
ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;

-- Update marking_method to include location verification
-- Already updated in previous migration to include 'face'

-- Add comments for documentation
COMMENT ON COLUMN public.lecture_sessions.location_latitude IS 'Latitude of class venue for geofencing';
COMMENT ON COLUMN public.lecture_sessions.location_longitude IS 'Longitude of class venue for geofencing';
COMMENT ON COLUMN public.lecture_sessions.location_radius IS 'Maximum allowed distance from venue in meters';
COMMENT ON COLUMN public.attendance_records.location_verified IS 'Whether student location was verified within range';
