-- ============================================
-- SIMPLE FIX FOR FACE ENROLLMENT BUG
-- ============================================
-- This is the minimal fix needed to make face enrollment work

-- Step 1: Drop old RLS policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Service can insert users" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own face data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Step 2: Create new RLS policies
CREATE POLICY "Service role full access"
ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON public.users FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'hod')));

-- Step 3: Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_matric TEXT;
  user_staff_id TEXT;
  user_level TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  IF user_role = 'student' THEN
    user_matric := NULLIF(NEW.raw_user_meta_data->>'matric_number', '');
    IF user_matric IS NULL THEN
      user_matric := 'TEMP-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    user_level := NULLIF(NEW.raw_user_meta_data->>'level', '');
    IF user_level IS NOT NULL AND user_level NOT IN ('100', '200', '300', '400', '500', 'PG') THEN
      user_level := NULL;
    END IF;
  ELSE
    user_matric := NULL;
    user_level := NULL;
  END IF;
  
  IF user_role = 'lecturer' THEN
    user_staff_id := NULLIF(NEW.raw_user_meta_data->>'staff_id', '');
    IF user_staff_id IS NULL THEN
      user_staff_id := 'STF-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  ELSE
    user_staff_id := NULL;
  END IF;

  INSERT INTO public.users (
    id, email, role, first_name, last_name, matric_number, staff_id, 
    department, level, title, phone_number, is_active, is_email_verified
  )
  VALUES (
    NEW.id, NEW.email, user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Unknown'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
    user_matric, user_staff_id,
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    user_level, NULLIF(NEW.raw_user_meta_data->>'title', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
    true, true
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create public.users record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done!
SELECT 'Fix applied successfully!' as result;

