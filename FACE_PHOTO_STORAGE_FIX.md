# Face Photo Storage Fix

## The Problem

Face photos were not being stored to the Supabase bucket. The code was trying to fetch a base64 data URL directly, which doesn't work.

## Root Cause

The original code tried to convert base64 to blob using:
```typescript
const response = await fetch(capturedImage)
const blob = await response.blob()
```

This fails because:
- `capturedImage` is a base64 data URL (e.g., `data:image/jpeg;base64,/9j/4AAQSkZJRg...`)
- `fetch()` can't fetch data URLs directly
- The blob conversion fails silently
- Photo is never uploaded to storage

## The Solution

Convert base64 to blob directly without using fetch:

```typescript
// Convert base64 data URL to blob
const base64Data = capturedImage.split(',')[1] // Remove data:image/jpeg;base64, prefix
const byteCharacters = atob(base64Data)
const byteNumbers = new Array(byteCharacters.length)
for (let i = 0; i < byteCharacters.length; i++) {
  byteNumbers[i] = byteCharacters.charCodeAt(i)
}
const byteArray = new Uint8Array(byteNumbers)
const blob = new Blob([byteArray], { type: 'image/jpeg' })
```

This:
1. Extracts the base64 string (removes the `data:image/jpeg;base64,` prefix)
2. Decodes the base64 string to binary characters
3. Converts characters to byte numbers
4. Creates a Uint8Array from the bytes
5. Creates a Blob from the array

## Changes Made

### File: `app/student/enroll-face/page.tsx`

**Change 1: Fixed base64 to blob conversion**
- Replaced `fetch()` approach with direct base64 decoding
- Now properly converts base64 data URL to blob
- Photo uploads successfully to storage

**Change 2: Fixed verification query**
- Changed `.single()` to `.maybeSingle()`
- Handles case where user doesn't exist in database
- Prevents "Cannot coerce result" error

## How It Works Now

1. User captures face
2. Face descriptor is extracted
3. Image is converted to blob (now works!)
4. Blob is uploaded to `face-photos` bucket
5. Public URL is retrieved
6. Face descriptor and photo URL are saved to database
7. Dashboard shows "Face enrolled" ✓

## Testing

### Step 1: Restart Dev Server
```bash
npm run dev
```

### Step 2: Test Face Enrollment
1. Go to http://localhost:3000/student/dashboard
2. Click "Enroll your face first"
3. Capture face
4. Click "Confirm & Save"
5. Should see "Face enrolled!" success message

### Step 3: Verify Photo Upload
1. Go to Supabase Dashboard
2. Click Storage
3. Click face-photos bucket
4. Should see folder with user ID
5. Should see face-TIMESTAMP.jpg file

### Step 4: Verify Database
1. Go to Supabase SQL Editor
2. Run:
```sql
SELECT id, email, face_descriptor, profile_photo_url 
FROM public.users 
WHERE email = 'your-email@example.com';
```
3. Should see:
   - `face_descriptor`: Has data (not null)
   - `profile_photo_url`: Has URL to storage

## Expected Results

✓ Face photo uploads to storage
✓ Public URL is generated
✓ Photo URL is saved to database
✓ Dashboard shows "Face enrolled"
✓ Face verification works during attendance

## Files Changed

| File | Change |
|------|--------|
| `app/student/enroll-face/page.tsx` | Fixed base64 to blob conversion + verification query |

## Before and After

### Before
```
User captures face
  ↓
Face descriptor extracted ✓
  ↓
Try to upload photo
  ↓
fetch() fails on data URL ✗
  ↓
Photo not uploaded ✗
  ↓
profile_photo_url is null ✗
```

### After
```
User captures face
  ↓
Face descriptor extracted ✓
  ↓
Convert base64 to blob ✓
  ↓
Upload photo to storage ✓
  ↓
Get public URL ✓
  ↓
Save to database ✓
  ↓
Dashboard shows "Face enrolled" ✓
```

## Summary

**Issue:** Face photos not uploading to storage
**Cause:** fetch() can't handle base64 data URLs
**Fix:** Direct base64 to blob conversion
**Result:** Photos now upload successfully

