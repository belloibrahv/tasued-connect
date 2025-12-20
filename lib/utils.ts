import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a time to a readable string
 */
export function formatTime(time: Date | string): string {
  const t = typeof time === 'string' ? new Date(time) : time
  return t.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0
  return Math.round((present / total) * 100)
}

/**
 * Get attendance status based on percentage
 */
export function getAttendanceStatus(percentage: number): {
  status: 'excellent' | 'good' | 'warning' | 'danger'
  color: string
  icon: string
} {
  if (percentage >= 90) {
    return { status: 'excellent', color: 'text-success', icon: '🟢' }
  } else if (percentage >= 75) {
    return { status: 'good', color: 'text-info', icon: '🟢' }
  } else if (percentage >= 60) {
    return { status: 'warning', color: 'text-warning', icon: '🟡' }
  } else {
    return { status: 'danger', color: 'text-error', icon: '🔴' }
  }
}

/**
 * Generate a random attendance code
 */
export function generateAttendanceCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    if (i < 2) code += '-'
  }

  return code
}

/**
 * Check if a student is late based on session start time
 */
export function isLate(
  sessionStartTime: Date | string,
  checkInTime: Date | string,
  lateThresholdMinutes: number = 15
): boolean {
  const start = typeof sessionStartTime === 'string' ? new Date(sessionStartTime) : sessionStartTime
  const checkIn = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime

  const diffMinutes = (checkIn.getTime() - start.getTime()) / (1000 * 60)
  return diffMinutes > lateThresholdMinutes
}

/**
 * Get minutes late
 */
export function getMinutesLate(
  sessionStartTime: Date | string,
  checkInTime: Date | string
): number {
  const start = typeof sessionStartTime === 'string' ? new Date(sessionStartTime) : sessionStartTime
  const checkIn = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime

  const diffMinutes = Math.floor((checkIn.getTime() - start.getTime()) / (1000 * 60))
  return Math.max(0, diffMinutes)
}
