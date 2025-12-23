-- Add face_descriptor column to users table
-- This stores the 128-dimensional face embedding as a JSON array

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS face_descriptor JSONB;

-- Add index for faster lookups (optional, for future face search features)
CREATE INDEX IF NOT EXISTS idx_users_face_descriptor 
ON public.users USING GIN (face_descriptor);

-- Add comment for documentation
COMMENT ON COLUMN public.users.face_descriptor IS 
'128-dimensional face embedding vector stored as JSON array for face recognition';
