# Database Reset and Setup Instructions

This document provides instructions for resetting the database and setting up sample users for the TASUED Connect application.

## Steps to Reset Database

### 1. Backup Current Data (Optional)
```sql
-- Run this to create a backup of your current data
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE courses_backup AS SELECT * FROM courses;
CREATE TABLE course_enrollments_backup AS SELECT * FROM course_enrollments;
CREATE TABLE lecture_sessions_backup AS SELECT * FROM lecture_sessions;
CREATE TABLE attendance_records_backup AS SELECT * FROM attendance_records;
```

### 2. Execute Fixed Database Schema Script
Run the following script to drop existing tables and recreate them with proper structure that fixes the UUID constraint issues:

```sql
-- Execute the complete reset script
\i DATABASE_FIXED_SCHEMA.sql
```

### 3. Create Sample Users
Run the sample users script to create test accounts:

```sql
-- Execute the sample users script
\i DATABASE_CREATE_SAMPLE_USERS_FIXED.sql
```

### 4. Alternative: Run Combined Fix Script
Or run the combined fix script that handles both reset and fixes:

```sql
-- Execute the combined fix script
\i DATABASE_FIX_SCRIPTS.sql
```

## Database Structure

The database contains the following tables:

### users
- Stores user profiles (extends auth.users)
- Contains fields for first_name, last_name, role, matric_number, staff_id, etc.
- Includes face_descriptor array for face recognition
- Has RLS policies for security

### courses
- Stores course information
- Links to lecturers who teach the course
- Includes code, name, description, and academic details

### course_enrollments
- Links students to courses they're enrolled in
- Tracks enrollment status

### lecture_sessions
- Stores lecture session information
- Links to courses and lecturers
- Contains session codes for attendance marking

### attendance_records
- Tracks student attendance for each session
- Supports multiple marking methods (QR, manual, face recognition)
- Stores geolocation data for verification

## Sample Users Created

The sample data script creates these users:

### Admin User
- Email: `admin@tasued.edu.ng`
- Role: admin
- First Name: System
- Last Name: Administrator

### Lecturer User
- Email: `john.doe@tasued.edu.ng`
- Role: lecturer
- Staff ID: TAS/CS/001
- Department: Computer Science
- Title: Dr.

### Student User
- Email: `jane.smith@stu.tasued.edu.ng`
- Role: student
- Matric Number: CSC/20/001
- Level: 200

## Troubleshooting Registration Issues

If you're experiencing "Database error saving new user" issues:

1. Ensure the `SUPABASE_SERVICE_ROLE_KEY` environment variable is properly set
2. Verify that the auth triggers are correctly set up (handled by the fix script)
3. Check that RLS policies are properly configured
4. Ensure the users table has the correct structure

## Fixing UUID Foreign Key Constraint Issues

If you encounter the error: "insert or update on table \"users\" violates foreign key constraint \"users_id_fkey\"", this means:

1. The users table was incorrectly set up with a foreign key constraint to auth.users
2. The fix involves removing explicit foreign key constraints and letting Supabase handle the relationship via RLS policies
3. The new schema uses gen_random_uuid() for proper UUID generation
4. The fixed scripts handle the relationship correctly without violating constraints

## Environment Variables Required

Make sure these environment variables are set in your Vercel deployment:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deployment to Vercel

After running the database reset:

1. Commit all changes
2. Push to your repository
3. Vercel will automatically redeploy the application
4. Run the database scripts in your Supabase SQL editor after deployment

## Verification

To verify the database setup worked correctly, you can run:

```sql
-- Check user counts
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check if tables have proper data
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM course_enrollments;
SELECT COUNT(*) FROM lecture_sessions;
SELECT COUNT(*) FROM attendance_records;

-- Verify RLS policies are in place
SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';
```