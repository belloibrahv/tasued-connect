# TASUED AttendX - Seeding & Test User Guide

Follow these steps to quickly populate your database and create test accounts for all roles.

## 1. Seeding Required Data (Courses & Enrollments)
We have provided an automated endpoint to populate the `courses` table.

1.  **Open your browser** and visit: `http://localhost:3000/api/seed`
2.  **Verify**: You should receive a JSON response: `{"message": "Seeding successful", ...}`.
3.  **Pro Tip**: If you are logged in as a **Lecturer** when you visit this URL, the new courses will automatically be assigned to you!
4.  **Pro Tip**: If you are logged in as a **Student** when you visit this URL, you will automatically be enrolled in 3 random courses!

---

## 2. Creating Test User Credentials

Since Supabase Auth is secure, you need to create users via the application's registration page.

### A. Student Account
1.  Go to the [Register Page](http://localhost:3000/register).
2.  Select **Student**.
3.  Fill in the details (Matric Number: `2022/1234`).
4.  After registering, check your Supabase Dashboard -> **Auth** to verify the user (or disable email confirmation in Supabase settings to log in immediately).

### B. Lecturer Account
1.  Go to the [Register Page](http://localhost:3000/register).
2.  Select **Lecturer**.
3.  Fill in the details (Staff ID: `STF/999`).
4.  Log in as this user to start creating sessions.

### C. Admin Account
To create an Admin, you must manually elevate a regular user:
1.  Register a new user (any role).
2.  Go to your **Supabase Dashboard** -> **Table Editor** -> `users` table.
3.  Find your user row and change the `role` column value from `student` to `admin`.

---

## 3. Testing User States
Once you have your users, you can test the following flows:
1.  **Lecturer**: Log in -> "Start New Session" -> Copy the ID or QR Code.
2.  **Student**: Log in -> "Scan QR" -> Verify attendance in dashboard.
3.  **Admin**: (Future implementation) Access system-wide metrics.
