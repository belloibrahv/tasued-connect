-- Fix for role differentiation issue
-- This migration ensures the handle_new_user trigger properly creates records in public.users
-- with correct handling of the matric_number and staff_id constraints

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the improved function that handles constraints properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_matric TEXT;
  user_staff_id TEXT;
  user_level TEXT;
BEGIN
  -- Get the role from metadata, default to 'student'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Handle matric_number for students (required by constraint)
  IF user_role = 'student' THEN
    user_matric := NULLIF(NEW.raw_user_meta_data->>'matric_number', '');
    -- If no matric number provided, generate a temporary one
    IF user_matric IS NULL THEN
      user_matric := 'TEMP-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    -- Level must be one of: '100', '200', '300', '400', '500', 'PG' or NULL
    user_level := NULLIF(NEW.raw_user_meta_data->>'level', '');
    IF user_level IS NOT NULL AND user_level NOT IN ('100', '200', '300', '400', '500', 'PG') THEN
      user_level := NULL;
    END IF;
  ELSE
    user_matric := NULL;
    user_level := NULL; -- Non-students don't have levels
  END IF;
  
  -- Handle staff_id for lecturers (required by constraint)
  IF user_role = 'lecturer' THEN
    user_staff_id := NULLIF(NEW.raw_user_meta_data->>'staff_id', '');
    -- If no staff_id provided, generate a temporary one
    IF user_staff_id IS NULL THEN
      user_staff_id := 'STF-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  ELSE
    user_staff_id := NULL;
  END IF;

  -- Insert the user record
  INSERT INTO public.users (
    id, 
    email, 
    role, 
    first_name, 
    last_name, 
    matric_number, 
    staff_id, 
    department, 
    level, 
    title,
    phone_number,
    is_active,
    is_email_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Unknown'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
    user_matric,
    user_staff_id,
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    user_level,
    NULLIF(NEW.raw_user_meta_data->>'title', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
    true,
    true  -- Since email confirmation is disabled
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Failed to create public.users record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Also fix any existing users in auth.users that don't have a public.users record
-- This is a one-time fix for users who registered before the trigger was working
DO $$
DECLARE
  auth_user RECORD;
  user_role TEXT;
  user_matric TEXT;
  user_staff_id TEXT;
  user_level TEXT;
  existing_staff_id TEXT;
  existing_matric TEXT;
BEGIN
  FOR auth_user IN 
    SELECT au.* 
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    user_role := COALESCE(auth_user.raw_user_meta_data->>'role', 'student');
    
    IF user_role = 'student' THEN
      user_matric := NULLIF(auth_user.raw_user_meta_data->>'matric_number', '');
      -- Check if matric_number already exists
      IF user_matric IS NOT NULL THEN
        SELECT matric_number INTO existing_matric FROM public.users WHERE matric_number = user_matric;
        IF existing_matric IS NOT NULL THEN
          -- Matric already exists, generate unique one
          user_matric := user_matric || '-' || SUBSTRING(auth_user.id::text, 1, 4);
        END IF;
      ELSE
        user_matric := 'TEMP-' || SUBSTRING(auth_user.id::text, 1, 8);
      END IF;
      user_staff_id := NULL;
      -- Level must be one of: '100', '200', '300', '400', '500', 'PG' or NULL
      user_level := NULLIF(auth_user.raw_user_meta_data->>'level', '');
      IF user_level IS NOT NULL AND user_level NOT IN ('100', '200', '300', '400', '500', 'PG') THEN
        user_level := NULL;
      END IF;
    ELSIF user_role = 'lecturer' THEN
      user_staff_id := NULLIF(auth_user.raw_user_meta_data->>'staff_id', '');
      -- Check if staff_id already exists
      IF user_staff_id IS NOT NULL THEN
        SELECT staff_id INTO existing_staff_id FROM public.users WHERE staff_id = user_staff_id;
        IF existing_staff_id IS NOT NULL THEN
          -- Staff ID already exists, generate unique one
          user_staff_id := user_staff_id || '-' || SUBSTRING(auth_user.id::text, 1, 4);
        END IF;
      ELSE
        user_staff_id := 'STF-' || SUBSTRING(auth_user.id::text, 1, 8);
      END IF;
      user_matric := NULL;
      user_level := NULL; -- Lecturers don't have levels
    ELSE
      user_matric := NULL;
      user_staff_id := NULL;
      user_level := NULL;
    END IF;
    
    BEGIN
      INSERT INTO public.users (
        id, email, role, first_name, last_name, 
        matric_number, staff_id, department, level, title,
        is_active, is_email_verified
      )
      VALUES (
        auth_user.id,
        auth_user.email,
        user_role,
        COALESCE(NULLIF(auth_user.raw_user_meta_data->>'first_name', ''), 'Unknown'),
        COALESCE(NULLIF(auth_user.raw_user_meta_data->>'last_name', ''), 'User'),
        user_matric,
        user_staff_id,
        NULLIF(auth_user.raw_user_meta_data->>'department', ''),
        user_level,
        NULLIF(auth_user.raw_user_meta_data->>'title', ''),
        true,
        true
      );
      
      RAISE NOTICE 'Created public.users record for: %', auth_user.email;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Skipped % due to unique constraint violation', auth_user.email;
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create record for %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
END $$;
