# Implementation Plan: Medium and Minor Fixes

## Overview

This implementation plan addresses medium-priority issues and minor improvements identified in the FaceCheck system. Tasks are ordered by impact and dependency, with the most critical fixes first.

## Tasks

- [x] 1. Implement Session Code Expiration Enforcement
  - [x] 1.1 Add expiration check in mark-attendance page
    - Update `verifySession` function to check `code_expires_at`
    - Display clear error message for expired codes
    - Prevent attendance marking for expired codes
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Add expiration countdown display
    - Show remaining time when session info is displayed
    - Format time remaining in human-readable format
    - _Requirements: 1.4_

- [x] 2. Create Database Performance Indexes
  - [x] 2.1 Create SQL migration for performance indexes
    - Add index on `attendance_records.marked_at`
    - Add index on `lecture_sessions.attendance_code`
    - Add index on `attendance_records.session_id`
    - Add composite index on `attendance_records(student_id, course_id)`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. Implement Automatic Attendance Percentage Updates
  - [x] 3.1 Create database trigger for attendance percentage
    - Create function to calculate attendance percentage
    - Create trigger on `attendance_records` INSERT
    - Handle edge case where `total_classes` is zero
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 3.2 Create trigger for session closure
    - Increment `total_classes` for enrolled students when session closes
    - _Requirements: 4.3_

- [x] 4. Checkpoint - Verify Database Changes
  - Run migrations in Supabase SQL Editor
  - Test attendance percentage auto-update
  - Verify indexes are created
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Fix QR Scanner Reinitialization
  - [x] 5.1 Update QRScanner component to reinitialize without page reload
    - Use React key to force remount instead of `window.location.reload()`
    - Properly clean up camera resources before reinitialization
    - Maintain state consistency during reset
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Optimize Realtime Hook with Singleton Client
  - [x] 6.1 Update Supabase client to use singleton pattern
    - Modify `lib/supabase/client.ts` to cache client instance
    - Ensure same instance is returned on subsequent calls
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Verify useAttendanceRealtime cleanup
    - Confirm subscription cleanup on unmount works correctly
    - _Requirements: 6.3_

- [x] 7. Improve Liveness Detection Configuration
  - [x] 7.1 Add configurable thresholds to liveness detection
    - Create `LIVENESS_CONFIG` object with adjustable values
    - Update `checkBlinkPattern` to use configurable threshold
    - Add confidence reporting to detection results
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Add retry with different challenge
    - Allow user to request different challenge after repeated failures
    - _Requirements: 3.4_

- [x] 8. Update Venue Coordinates Configuration
  - [x] 8.1 Refactor geolocation to use configurable venues
    - Update `TASUED_VENUES` with more accurate placeholder structure
    - Add `getVenueCoordinates` function with session fallback
    - Document how to update coordinates
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9. Create Error Boundary Component
  - [x] 9.1 Implement ErrorBoundary component
    - Create `components/ui/error-boundary.tsx`
    - Handle errors gracefully with user-friendly message
    - Provide retry functionality
    - Log errors for debugging
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Wrap critical components with ErrorBoundary
    - Add ErrorBoundary around face verification components
    - Add ErrorBoundary around QR scanner
    - _Requirements: 8.3_

- [x] 10. Final Checkpoint - Verify All Fixes
  - Test session code expiration with expired codes
  - Test QR scanner reset functionality
  - Verify attendance percentage updates automatically
  - Test error boundary with simulated failures
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Database migrations (Tasks 2, 3) should be run in Supabase SQL Editor
- Task 6 (singleton client) may require testing realtime subscriptions
- Error boundaries (Task 9) are React class components due to lifecycle requirements
- Venue coordinates (Task 8) are placeholders - actual GPS coordinates should be obtained on-site
