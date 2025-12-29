# Requirements Document

## Introduction

This document outlines the requirements for fixing critical security and functionality issues in the FaceCheck attendance system. The fixes address route protection, missing database tables, and storage bucket configuration.

## Glossary

- **Middleware**: Server-side code that runs before a request is completed, used for authentication checks
- **RLS**: Row Level Security - Supabase's mechanism for controlling data access
- **Storage_Bucket**: Supabase Storage container for file uploads
- **System_Metrics**: Database table for storing system-wide statistics

## Requirements

### Requirement 1: Route Protection Middleware

**User Story:** As a system administrator, I want protected routes to require authentication, so that unauthorized users cannot access student, lecturer, or admin dashboards.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access `/student/*` routes, THE Middleware SHALL redirect them to `/login`
2. WHEN an unauthenticated user attempts to access `/lecturer/*` routes, THE Middleware SHALL redirect them to `/login`
3. WHEN an unauthenticated user attempts to access `/admin/*` routes, THE Middleware SHALL redirect them to `/login`
4. WHEN an authenticated student attempts to access `/lecturer/*` routes, THE Middleware SHALL redirect them to `/student/dashboard`
5. WHEN an authenticated student attempts to access `/admin/*` routes, THE Middleware SHALL redirect them to `/student/dashboard`
6. WHEN an authenticated lecturer attempts to access `/admin/*` routes, THE Middleware SHALL redirect them to `/lecturer/dashboard`
7. WHEN an authenticated user accesses `/login` or `/register`, THE Middleware SHALL redirect them to their appropriate dashboard
8. THE Middleware SHALL allow public access to `/`, `/login`, `/register`, `/auth/callback`, and `/api/*` routes

### Requirement 2: Admin Dashboard System Metrics

**User Story:** As an admin, I want to see accurate system statistics on my dashboard, so that I can monitor the health and usage of the attendance system.

#### Acceptance Criteria

1. THE Database SHALL have a `system_metrics` table with columns for id, metric_name, value, and updated_at
2. WHEN the admin dashboard loads, THE System SHALL query actual counts from users, courses, and sessions tables
3. THE Admin_Dashboard SHALL display total registered users count
4. THE Admin_Dashboard SHALL display total active courses count
5. THE Admin_Dashboard SHALL display currently active sessions count
6. THE Admin_Dashboard SHALL display average attendance percentage across all enrollments
7. IF the system_metrics table query fails, THEN THE Admin_Dashboard SHALL fall back to direct table counts

### Requirement 3: Face Photo Storage Configuration

**User Story:** As a student, I want to successfully upload my face photo during enrollment, so that I can use face verification for attendance.

#### Acceptance Criteria

1. THE System SHALL provide SQL migration script to create `face-photos` storage bucket
2. THE Storage_Bucket SHALL allow authenticated users to upload files to their own folder (user_id/*)
3. THE Storage_Bucket SHALL allow authenticated users to read their own uploaded files
4. THE Storage_Bucket SHALL allow public read access for profile photos (for verification display)
5. THE Storage_Bucket SHALL restrict file uploads to image types only (jpeg, png, webp)
6. THE Storage_Bucket SHALL limit file size to 5MB maximum
7. WHEN a student uploads a face photo, THE System SHALL store it in the `face-photos` bucket under their user ID folder

### Requirement 4: Login Redirect for Admin Users

**User Story:** As an admin user, I want to be redirected to the admin dashboard after login, so that I can access admin features directly.

#### Acceptance Criteria

1. WHEN an admin user logs in successfully, THE Login_Page SHALL redirect them to `/admin/dashboard`
2. WHEN a lecturer user logs in successfully, THE Login_Page SHALL redirect them to `/lecturer/dashboard`
3. WHEN a student user logs in successfully, THE Login_Page SHALL redirect them to `/student/dashboard`
4. WHEN an HOD user logs in successfully, THE Login_Page SHALL redirect them to `/admin/dashboard`
