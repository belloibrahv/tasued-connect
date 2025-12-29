# Requirements Document

## Introduction

This document specifies requirements for addressing medium and minor issues identified in the FaceCheck attendance system. These issues affect system reliability, user experience, and code quality but are not critical blockers.

## Glossary

- **Geolocation_Service**: The module responsible for verifying student physical location during attendance marking
- **Liveness_Detection**: The module that prevents spoofing by requiring user interaction (blink, head turn)
- **Session_Code**: A unique alphanumeric code generated for each lecture session to mark attendance
- **QR_Scanner**: Component that scans QR codes containing session codes
- **Realtime_Hook**: React hook that subscribes to database changes for live attendance updates
- **Attendance_Percentage**: Calculated metric showing student's attendance rate for a course

## Requirements

### Requirement 1: Session Code Expiration Enforcement

**User Story:** As a lecturer, I want expired session codes to be rejected, so that students cannot mark attendance after the designated time window.

#### Acceptance Criteria

1. WHEN a student submits a session code, THE Mark_Attendance_Page SHALL check if `code_expires_at` timestamp has passed
2. IF the session code has expired, THEN THE System SHALL display an error message "Session code has expired"
3. IF the session code has expired, THEN THE System SHALL prevent attendance marking regardless of session status
4. WHEN displaying session info, THE System SHALL show remaining time until code expiration

### Requirement 2: Configurable Venue Coordinates

**User Story:** As an administrator, I want to configure venue GPS coordinates, so that location verification uses accurate positions.

#### Acceptance Criteria

1. THE Geolocation_Service SHALL load venue coordinates from a configurable source rather than hardcoded values
2. WHEN a venue is not found in configuration, THE System SHALL fall back to session-specific coordinates
3. THE System SHALL provide a mechanism to add or update venue coordinates
4. WHEN venue coordinates are updated, THE System SHALL use the new values for subsequent verifications

### Requirement 3: Improved Liveness Detection Threshold

**User Story:** As a student, I want reliable liveness detection, so that I can complete verification without false failures.

#### Acceptance Criteria

1. THE Liveness_Detection SHALL use a configurable variance threshold for blink detection
2. WHEN blink detection fails, THE System SHALL provide clear feedback about what went wrong
3. THE Liveness_Detection SHALL track detection confidence and report it to the user
4. THE System SHALL allow retry with different challenge if initial challenge fails repeatedly

### Requirement 4: Automatic Attendance Percentage Updates

**User Story:** As a student, I want my attendance percentage to update automatically, so that I can see accurate statistics.

#### Acceptance Criteria

1. WHEN an attendance record is inserted, THE Database SHALL automatically recalculate the student's attendance percentage
2. THE Attendance_Percentage calculation SHALL be: (classes_attended / total_classes) * 100
3. WHEN a lecture session is closed, THE Database SHALL increment total_classes for all enrolled students
4. THE System SHALL handle edge cases where total_classes is zero

### Requirement 5: QR Scanner Proper Reinitialization

**User Story:** As a student, I want to scan another QR code without page reload, so that I have a smoother experience.

#### Acceptance Criteria

1. WHEN the user requests to scan again, THE QR_Scanner SHALL reinitialize without full page reload
2. THE QR_Scanner SHALL properly clean up camera resources before reinitialization
3. THE QR_Scanner SHALL maintain state consistency during reinitialization

### Requirement 6: Realtime Hook Optimization

**User Story:** As a developer, I want efficient realtime subscriptions, so that the application performs well.

#### Acceptance Criteria

1. THE Realtime_Hook SHALL use a singleton or memoized Supabase client
2. THE Realtime_Hook SHALL not create new client instances on each render
3. THE Realtime_Hook SHALL properly clean up subscriptions on unmount

### Requirement 7: Database Performance Indexes

**User Story:** As a system administrator, I want optimized database queries, so that the system responds quickly.

#### Acceptance Criteria

1. THE Database SHALL have an index on `attendance_records.marked_at` for sorting operations
2. THE Database SHALL have an index on `lecture_sessions.attendance_code` for code lookups
3. THE Database SHALL have an index on `attendance_records.session_id` for session queries

### Requirement 8: Error Boundary Implementation

**User Story:** As a student, I want graceful error handling, so that one component failure doesn't crash the entire page.

#### Acceptance Criteria

1. WHEN face-api.js fails to load, THE System SHALL display a user-friendly error message
2. WHEN camera access fails, THE System SHALL provide recovery options
3. THE System SHALL implement error boundaries around critical components
4. WHEN an error occurs, THE System SHALL log details for debugging while showing user-friendly message
