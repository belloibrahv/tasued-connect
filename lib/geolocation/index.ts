/**
 * Geolocation utilities for attendance verification
 * Ensures students are physically present in the classroom
 */

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface LocationVerificationResult {
  isWithinRange: boolean
  distance: number // in meters
  accuracy: number // GPS accuracy in meters
  message: string
}

/**
 * Get current device location
 * @returns Promise with coordinates or error
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable. Please try again.'))
            break
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'))
            break
          default:
            reject(new Error('An unknown error occurred while getting location.'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180
  const φ2 = (coord2.latitude * Math.PI) / 180
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Verify if student is within acceptable range of class location
 * @param studentLocation - Student's current coordinates
 * @param classLocation - Class/venue coordinates
 * @param maxDistance - Maximum allowed distance in meters (default 100m)
 * @returns Verification result
 */
export function verifyLocation(
  studentLocation: Coordinates,
  classLocation: Coordinates,
  maxDistance: number = 100
): LocationVerificationResult {
  const distance = calculateDistance(studentLocation, classLocation)
  const isWithinRange = distance <= maxDistance
  
  let message: string
  if (isWithinRange) {
    message = `You are ${Math.round(distance)}m from the class location. ✓`
  } else {
    message = `You are ${Math.round(distance)}m away. Must be within ${maxDistance}m of the class.`
  }

  return {
    isWithinRange,
    distance: Math.round(distance),
    accuracy: studentLocation.accuracy || 0,
    message
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
}

/**
 * Check if location services are available
 */
export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/**
 * TASUED Campus Locations (predefined venues)
 * These can be expanded or moved to database
 */
export const TASUED_VENUES: Record<string, Coordinates> = {
  // Main Campus Buildings
  'CSC Lab 1': { latitude: 6.8167, longitude: 3.9333 },
  'CSC Lab 2': { latitude: 6.8168, longitude: 3.9334 },
  'Science Building': { latitude: 6.8165, longitude: 3.9330 },
  'Main Auditorium': { latitude: 6.8170, longitude: 3.9340 },
  'Faculty of Science': { latitude: 6.8166, longitude: 3.9332 },
  'Lecture Hall A': { latitude: 6.8169, longitude: 3.9335 },
  'Lecture Hall B': { latitude: 6.8171, longitude: 3.9337 },
  // Add more venues as needed
}

/**
 * Get venue coordinates by name
 */
export function getVenueCoordinates(venueName: string): Coordinates | null {
  return TASUED_VENUES[venueName] || null
}

/**
 * Get list of available venues
 */
export function getAvailableVenues(): string[] {
  return Object.keys(TASUED_VENUES)
}
