# Design Document: Medium and Minor Fixes

## Overview

This design addresses medium-priority issues and minor improvements for the FaceCheck attendance system. The fixes improve reliability, user experience, and code quality without changing core functionality.

## Architecture

The fixes span multiple layers of the application:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ QRScanner   │  │ ErrorBoundary│  │ MarkAttendancePage │  │
│  │ (reinit)    │  │ (new)        │  │ (expiration check) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Hooks & Services                          │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │ useAttendanceRealtime│  │ Liveness Detection         │   │
│  │ (singleton client)   │  │ (configurable threshold)   │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Configuration                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ lib/geolocation/venues.ts (configurable coordinates)│    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Indexes     │  │ Triggers    │  │ Functions           │  │
│  │ (performance)│  │ (auto-calc) │  │ (attendance %)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Session Code Expiration Check

**Location:** `app/student/mark-attendance/page.tsx`

```typescript
// Add expiration check in verifySession function
const verifySession = async () => {
  // ... existing code ...
  
  const { data: sessionData } = await supabase
    .from("lecture_sessions")
    .select("*, courses(code, title)")
    .eq("attendance_code", sessionCode.toUpperCase())
    .eq("status", "active")
    .single()
  
  // NEW: Check code expiration
  if (sessionData?.code_expires_at) {
    const expiresAt = new Date(sessionData.code_expires_at)
    if (expiresAt < new Date()) {
      setError("Session code has expired. Please ask your lecturer for a new code.")
      return
    }
  }
  
  // ... rest of existing code ...
}
```

### 2. Configurable Venue Coordinates

**Location:** `lib/geolocation/index.ts`

```typescript
// Configuration object for venue coordinates
export interface VenueConfig {
  name: string
  latitude: number
  longitude: number
  radius?: number // Optional custom radius
}

// Default TASUED venues - can be overridden via environment or database
export const DEFAULT_VENUES: Record<string, VenueConfig> = {
  'CSC Lab 1': { name: 'CSC Lab 1', latitude: 6.8167, longitude: 3.9333 },
  // ... other venues
}

// Function to get venue coordinates with fallback
export function getVenueCoordinates(
  venueName: string,
  sessionCoords?: { latitude: number; longitude: number }
): Coordinates | null {
  // Priority: session-specific > configured venues > null
  if (sessionCoords?.latitude && sessionCoords?.longitude) {
    return sessionCoords
  }
  return DEFAULT_VENUES[venueName] || null
}
```

### 3. Liveness Detection Configuration

**Location:** `lib/liveness-detection/index.ts`

```typescript
// Configurable thresholds
export const LIVENESS_CONFIG = {
  blinkVarianceThreshold: 0.02, // 2% - can be adjusted
  movementThreshold: 0.15, // 15% of face width
  maxAttempts: 60, // frames to check
  minPositionHistory: 3,
  maxPositionHistory: 10,
}

// Enhanced blink detection with confidence reporting
export function checkBlinkPattern(
  currentPosition: FacePosition
): { detected: boolean; confidence: number } {
  // ... implementation with configurable threshold
}
```

### 4. Database Trigger for Attendance Percentage

**Location:** `lib/supabase/migrations/attendance_percentage_trigger.sql`

```sql
-- Function to update attendance percentage
CREATE OR REPLACE FUNCTION update_attendance_percentage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the student's attendance stats for this course
  UPDATE course_enrollments
  SET 
    classes_attended = (
      SELECT COUNT(*) FROM attendance_records 
      WHERE student_id = NEW.student_id 
      AND course_id = NEW.course_id 
      AND status = 'present'
    ),
    attendance_percentage = CASE 
      WHEN total_classes > 0 THEN 
        ROUND((classes_attended::numeric / total_classes) * 100, 2)
      ELSE 0
    END,
    updated_at = NOW()
  WHERE student_id = NEW.student_id AND course_id = NEW.course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on attendance_records insert
CREATE TRIGGER trigger_update_attendance_percentage
AFTER INSERT ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_attendance_percentage();
```

### 5. QR Scanner Reinitialization

**Location:** `components/student/QRScanner.tsx`

```typescript
export function QRScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  const [scannerKey, setScannerKey] = useState(0) // Key for forcing remount

  const handleReset = useCallback(() => {
    if (scanner) {
      scanner.clear().then(() => {
        setScannerKey(prev => prev + 1) // Force remount
      }).catch(console.error)
    }
  }, [scanner])

  // ... rest of implementation
}
```

### 6. Singleton Supabase Client for Realtime Hook

**Location:** `lib/supabase/client.ts` (update existing)

```typescript
let supabaseInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance
  
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
}
```

### 7. Database Performance Indexes

**Location:** `lib/supabase/migrations/add_performance_indexes.sql`

```sql
-- Index for attendance_records sorting by marked_at
CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_at 
ON attendance_records(marked_at DESC);

-- Index for session code lookups
CREATE INDEX IF NOT EXISTS idx_lecture_sessions_attendance_code 
ON lecture_sessions(attendance_code);

-- Index for session-based attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id 
ON attendance_records(session_id);

-- Composite index for student attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_course 
ON attendance_records(student_id, course_id);
```

### 8. Error Boundary Component

**Location:** `components/ui/error-boundary.tsx`

```typescript
'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Data Models

No new data models required. Existing models are enhanced with:

1. **course_enrollments**: `attendance_percentage` auto-calculated via trigger
2. **lecture_sessions**: `code_expires_at` now enforced in application logic

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Session Code Expiration Enforcement
*For any* session code with a `code_expires_at` timestamp in the past, the system SHALL reject attendance marking attempts and display an expiration error.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Attendance Percentage Consistency
*For any* student enrolled in a course, after an attendance record is inserted, the `attendance_percentage` in `course_enrollments` SHALL equal `(classes_attended / total_classes) * 100` rounded to 2 decimal places.
**Validates: Requirements 4.1, 4.2**

### Property 3: QR Scanner State Consistency
*For any* QR scanner reset operation, the scanner SHALL be in a ready-to-scan state after reinitialization without requiring page reload.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 4: Supabase Client Singleton
*For any* number of `createClient()` calls within the same browser session, the function SHALL return the same Supabase client instance.
**Validates: Requirements 6.1, 6.2**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Session code expired | Display clear message with suggestion to request new code |
| Venue coordinates not found | Fall back to session-specific coordinates or skip location check |
| Liveness detection timeout | Allow retry with different challenge |
| Face-api.js load failure | Show error boundary with retry option |
| Database trigger failure | Log error, attendance still recorded, percentage updated on next query |
| QR scanner init failure | Display camera permission instructions |

## Testing Strategy

### Unit Tests
- Session code expiration logic
- Venue coordinate lookup with fallbacks
- Liveness threshold calculations
- Attendance percentage calculation

### Property-Based Tests
- Property 1: Generate random timestamps and verify expiration logic
- Property 2: Generate random attendance records and verify percentage calculation
- Property 4: Multiple createClient calls return same instance

### Integration Tests
- Full attendance marking flow with expired code
- QR scanner reset and rescan
- Realtime subscription with singleton client
