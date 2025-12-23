# TASUED FaceCheck - Database Seeding Guide

## Quick Start: Test Credentials

### 🎓 Test Lecturer Account
```
Email: ogunsanwo@tasued.edu.ng
Password: Lecturer123!
```

### 👨‍🎓 Test Student Account
```
Email: student@test.com
Password: Student123!
Matric: 2022/1234
```

---

## Step-by-Step Setup

### 1. Create Lecturer Account in Supabase

1. Go to your **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Enter:
   - Email: `ogunsanwo@tasued.edu.ng`
   - Password: `Lecturer123!`
   - ✅ Check "Auto Confirm User"
4. Click **Create User**
5. **Copy the User UID** (you'll need this)

6. Go to **SQL Editor** and run:

```sql
-- Replace 'YOUR_LECTURER_UUID' with the actual UUID from step 5
INSERT INTO public.users (id, email, first_name, last_name, role, title, staff_id, department)
VALUES (
    'YOUR_LECTURER_UUID',
    'ogunsanwo@tasued.edu.ng',
    'Ganiyu',
    'Ogunsanwo',
    'lecturer',
    'Dr.',
    'STF/CSC/001',
    'Computer Science'
);
```

### 2. Seed Courses

1. **Log in as the lecturer** at http://localhost:3000/login
2. Visit: http://localhost:3000/api/seed
3. You should see: `{"message": "Seeding successful", "assignedToUser": "Yes"}`

This creates 5 courses and assigns them to the logged-in lecturer.

### 3. Create Student Account

**Option A: Via Registration Page**
1. Go to http://localhost:3000/register
2. Select **Student**
3. Fill in details (Matric: `2022/1234`)
4. Confirm email in Supabase Dashboard if needed

**Option B: Via Supabase Dashboard**
1. Go to **Authentication** → **Users** → **Add User**
2. Enter:
   - Email: `student@test.com`
   - Password: `Student123!`
   - ✅ Check "Auto Confirm User"
3. Copy the User UID
4. Run in SQL Editor:

```sql
-- Replace 'YOUR_STUDENT_UUID' with the actual UUID
INSERT INTO public.users (id, email, first_name, last_name, role, matric_number, department, level)
VALUES (
    'YOUR_STUDENT_UUID',
    'student@test.com',
    'Test',
    'Student',
    'student',
    '2022/1234',
    'Computer Science',
    '400'
);
```

### 4. Enroll Student in Courses

After creating the student, run:

```sql
-- Replace UUIDs with actual values
INSERT INTO public.course_enrollments (course_id, student_id, status)
SELECT c.id, 'YOUR_STUDENT_UUID', 'active'
FROM public.courses c
WHERE c.code IN ('CSC 415', 'CSC 412', 'EDU 411');
```

Or simply:
1. Log in as the student
2. Visit: http://localhost:3000/api/seed
3. This auto-enrolls the student in 3 random courses

---

## Testing Flows

### Lecturer Flow
1. Log in as lecturer
2. Go to Dashboard → **Start Session**
3. Select a course → Session code is generated
4. Share the code/QR with students

### Student Flow
1. Log in as student
2. **Enroll Face** (required first time)
3. **Mark Attendance**:
   - Enter session code OR scan QR
   - Complete location verification
   - Complete liveness check (blink/turn head)
   - Complete face verification
4. View attendance in **My Courses**

---

## Admin Account

To create an admin:
1. Create a regular user (any method above)
2. Go to **Table Editor** → `users` table
3. Find the user and change `role` to `admin`

---

## Troubleshooting

**"User not found" after login:**
- Make sure the user exists in BOTH `auth.users` AND `public.users` tables

**"Not enrolled in course":**
- Run the enrollment SQL or visit `/api/seed` while logged in as student

**Courses not showing for lecturer:**
- Make sure `lecturer_id` in courses table matches the lecturer's UUID
