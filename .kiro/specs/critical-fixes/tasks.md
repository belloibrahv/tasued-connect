# Implementation Plan: Critical Security and Functionality Fixes

## Overview

This implementation plan addresses three critical issues: missing route protection middleware, admin dashboard system metrics failures, and face photo storage bucket configuration. Tasks are ordered to build incrementally with dependencies resolved.

## Tasks

- [x] 1. Create Route Protection Middleware
  - [x] 1.1 Create `middleware.ts` in project root with Supabase session handling
    - Import createServerClient from @supabase/ssr
    - Configure cookie handling for Next.js middleware
    - Implement getSession function to retrieve current user
    - _Requirements: 1.1, 1.2, 1.3, 1.8_

  - [x] 1.2 Implement route classification and protection logic
    - Define public routes array (/, /login, /register, /auth/callback, /api/*)
    - Define protected route patterns for student, lecturer, admin
    - Implement isPublicRoute helper function
    - _Requirements: 1.8_

  - [x] 1.3 Implement role-based access control in middleware
    - Fetch user role from users table after session validation
    - Implement role-to-allowed-routes mapping
    - Add redirect logic for unauthorized role access
    - _Requirements: 1.4, 1.5, 1.6_

  - [x] 1.4 Implement authenticated user redirect from auth pages
    - Check if authenticated user is accessing /login or /register
    - Redirect to appropriate dashboard based on role
    - _Requirements: 1.7_

  - [x] 1.5 Configure middleware matcher in next.config
    - Export config with matcher array
    - Exclude static files, images, and _next paths
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Fix Admin Dashboard Statistics
  - [x] 2.1 Update admin dashboard to use direct table counts
    - Remove system_metrics query
    - Add parallel queries for users, courses, sessions counts
    - Calculate average attendance from course_enrollments
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Add error handling and fallback for stats queries
    - Wrap each query in try-catch
    - Display 0 with warning indicator on failure
    - Add console logging for debugging
    - _Requirements: 2.7_

- [x] 3. Create Face Photo Storage Migration
  - [x] 3.1 Create SQL migration script for face-photos bucket
    - Create storage bucket with public read access
    - Add RLS policy for authenticated user uploads to own folder
    - Add RLS policy for authenticated user reads of own files
    - Add file type and size restrictions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Update SEEDING_GUIDE.md with storage setup instructions
    - Document bucket creation steps
    - Include RLS policy SQL
    - Add troubleshooting section
    - _Requirements: 3.1_

- [x] 4. Fix Login Page Role Redirect
  - [x] 4.1 Update login page redirect logic to handle all roles
    - Add admin and hod role checks
    - Redirect admin/hod to /admin/dashboard
    - Keep existing lecturer and student redirects
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Checkpoint - Verify All Fixes
  - Test middleware protection by accessing protected routes without auth
  - Test role-based access by logging in as different user types
  - Verify admin dashboard loads without errors
  - Test face enrollment upload flow
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks are ordered by dependency: middleware first, then dashboard, then storage, then login
- The middleware implementation uses Supabase SSR for proper cookie handling in Next.js
- Storage bucket creation requires Supabase dashboard access or service role key
- All changes maintain backward compatibility with existing functionality
