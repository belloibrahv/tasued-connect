-- Add face_descriptor column to users table
-- This column stores the serialized face descriptor data for face recognition

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS face_descriptor REAL[];

-- Add comment to document the face_descriptor column
COMMENT ON COLUMN users.face_descriptor IS '128-dimensional face embedding vector stored as array for face recognition';

-- Add profile_photo_url column to store the URL of the enrolled face photo
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create index on face_descriptor for faster queries (if needed)
-- Note: PostgreSQL doesn't support GIN indexes on REAL[] arrays directly
-- Consider using a different approach if performance becomes an issue

-- Update RLS policies to allow users to update their own face descriptors
-- This assumes there are RLS policies on the users table

-- Grant permissions if needed
-- GRANT UPDATE (face_descriptor, profile_photo_url) ON users TO authenticated;