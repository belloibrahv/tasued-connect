/**
 * Geolocation utilities for attendance verification
 * Ensures students are physically present in the classroom
 */

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface VenueConfig {
  name: string
  latitude: number
  longitude: number
  radius?: number // Optional custom radius for this venue
  building?: string
  floor?: string
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
 * TASUED Campus Venues Configuration
 * 
 * NOTE: These are PLACEHOLDER coordinates and should be updated with actual GPS coordinates.
 * To get accurate coordinates:
 * 1. Visit each venue with a smartphone
 * 2. Use Google Maps or a GPS app to get the exact coordinates
 * 3. Update the values below
 * 
 * The coordinates below are approximate for TASUED main campus area.
 * Actual venue coordinates will vary based on specific building locations.
 * 
 * TASUED Main Campus approximate center: 6.8167°N, 3.9333°E
 */
export const TASUED_VENUES: Record<string, VenueConfig> = {
  // Computer Science Department
  'CSC Lab 1': { 
    name: 'CSC Lab 1',
    latitude: 6.8167, 
    longitude: 3.9333,
    building: 'Computer Science Building',
    floor: 'Ground Floor'
  },
  'CSC Lab 2': { 
    name: 'CSC Lab 2',
    latitude: 6.8168, 
    longitude: 3.9334,
    building: 'Computer Science Building',
    floor: 'First Floor'
  },
  
  // Science Faculty Buildings
  'Science Building': { 
    name: 'Science Building',
    latitude: 6.8165, 
    longitude: 3.9330,
    building: 'Faculty of Science'
  },
  'Faculty of Science': { 
    name: 'Faculty of Science',
    latitude: 6.8166, 
    longitude: 3.9332,
    building: 'Faculty of Science Main'
  },
  
  // Lecture Halls
  'Main Auditorium': { 
    name: 'Main Auditorium',
    latitude: 6.8170, 
    longitude: 3.9340,
    building: 'Central Admin',
    radius: 150 // Larger radius for auditorium
  },
  'Lecture Hall A': { 
    name: 'Lecture Hall A',
    latitude: 6.8169, 
    longitude: 3.9335,
    building: 'Lecture Complex'
  },
  'Lecture Hall B': { 
    name: 'Lecture Hall B',
    latitude: 6.8171, 
    longitude: 3.9337,
    building: 'Lecture Complex'
  },
  
  // Add more venues as needed
}

// Mutable venues store for runtime updates
let customVenues: Record<string, VenueConfig> = {}

/**
 * Get venue coordinates by name with fallback to session coordinates
 * Priority: Custom venues > Default venues > Session coordinates > null
 * 
 * @param venueName - Name of the venue to look up
 * @param sessionCoords - Optional session-specific coordinates as fallback
 * @returns Coordinates or null if not found
 */
export function getVenueCoordinatesWithFallback(
  venueName: string,
  sessionCoords?: { latitude: number; longitude: number }
): Coordinates | null {
  // Check custom venues first
  if (customVenues[venueName]) {
    return {
      latitude: customVenues[venueName].latitude,
      longitude: customVenues[venueName].longitude
    }
  }
  
  // Check default venues
  if (TASUED_VENUES[venueName]) {
    return {
      latitude: TASUED_VENUES[venueName].latitude,
      longitude: TASUED_VENUES[venueName].longitude
    }
  }
  
  // Fall back to session-specific coordinates
  if (sessionCoords?.latitude && sessionCoords?.longitude) {
    return {
      latitude: sessionCoords.latitude,
      longitude: sessionCoords.longitude
    }
  }
  
  return null
}

/**
 * Get venue coordinates by name (legacy function for backward compatibility)
 */
export function getVenueCoordinates(venueName: string): Coordinates | null {
  const venue = customVenues[venueName] || TASUED_VENUES[venueName]
  if (!venue) return null
  
  return {
    latitude: venue.latitude,
    longitude: venue.longitude
  }
}

/**
 * Get full venue configuration including optional radius
 */
export function getVenueConfig(venueName: string): VenueConfig | null {
  return customVenues[venueName] || TASUED_VENUES[venueName] || null
}

/**
 * Get list of available venues
 */
export function getAvailableVenues(): string[] {
  const defaultVenues = Object.keys(TASUED_VENUES)
  const custom = Object.keys(customVenues)
  return Array.from(new Set([...defaultVenues, ...custom]))
}

/**
 * Add or update a custom venue at runtime
 * This allows administrators to add venues without code changes
 */
export function addCustomVenue(venue: VenueConfig): void {
  customVenues[venue.name] = venue
}

/**
 * Remove a custom venue
 */
export function removeCustomVenue(venueName: string): boolean {
  if (customVenues[venueName]) {
    delete customVenues[venueName]
    return true
  }
  return false
}

/**
 * Clear all custom venues
 */
export function clearCustomVenues(): void {
  customVenues = {}
}

/**
 * Get all venues (both default and custom)
 */
export function getAllVenues(): Record<string, VenueConfig> {
  return { ...TASUED_VENUES, ...customVenues }
}
