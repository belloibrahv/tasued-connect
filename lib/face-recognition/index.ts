// This module only works in the browser
// All functions should be called from client components only

let faceapi: typeof import('face-api.js') | null = null

// Track if models are loaded
let modelsLoaded = false

// Track model loading promise to prevent multiple concurrent loads
let modelLoadingPromise: Promise<boolean> | null = null

// Model URLs - using jsdelivr CDN for face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model'

/**
 * Dynamically import face-api.js (client-side only)
 */
async function getFaceApi() {
  if (typeof window === 'undefined') {
    throw new Error('Face recognition only works in the browser')
  }
  
  if (!faceapi) {
    faceapi = await import('face-api.js')
  }
  
  return faceapi
}

/**
 * Load face-api.js models
 * Models needed:
 * - tinyFaceDetector: Fast face detection
 * - faceLandmark68Net: Facial landmark detection
 * - faceRecognitionNet: Face descriptor extraction for comparison
 */
export async function loadModels(): Promise<boolean> {
  if (modelsLoaded) return true
  
  // If already loading, return the existing promise
  if (modelLoadingPromise) {
    return modelLoadingPromise
  }
  
  modelLoadingPromise = (async () => {
    try {
      const api = await getFaceApi()
      
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      
      modelsLoaded = true
      console.log('Face recognition models loaded successfully')
      return true
    } catch (error) {
      console.error('Failed to load face recognition models:', error)
      return false
    } finally {
      // Reset the loading promise when complete
      modelLoadingPromise = null
    }
  })()
  
  return modelLoadingPromise
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
  return modelsLoaded
}

/**
 * Preload models without blocking - call this early in your app lifecycle
 */
export async function preloadModels(): Promise<void> {
  // Start loading models in the background
  loadModels().catch(error => {
    console.error('Preloading models failed:', error)
  })
}

/**
 * Detect face and extract descriptor from an image
 * @param imageSource - HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
 * @returns Face descriptor (128-dimensional vector) or null if no face detected
 */
export async function extractFaceDescriptor(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    const loaded = await loadModels()
    if (!loaded) return null
  }
  
  try {
    const api = await getFaceApi()
    
    const detection = await api
      .detectSingleFace(imageSource, new api.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      }))
      .withFaceLandmarks()
      .withFaceDescriptor()
    
    if (!detection) {
      console.log('No face detected in image')
      return null
    }
    
    return detection.descriptor
  } catch (error) {
    console.error('Error extracting face descriptor:', error)
    return null
  }
}

/**
 * Extract face descriptor from a base64 image string
 * @param base64Image - Base64 encoded image (with or without data URL prefix)
 * @returns Face descriptor or null
 */
export async function extractDescriptorFromBase64(
  base64Image: string
): Promise<Float32Array | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = async () => {
      const descriptor = await extractFaceDescriptor(img)
      resolve(descriptor)
    }
    
    img.onerror = () => {
      console.error('Failed to load image from base64')
      resolve(null)
    }
    
    // Ensure proper data URL format
    if (!base64Image.startsWith('data:')) {
      base64Image = `data:image/jpeg;base64,${base64Image}`
    }
    
    img.src = base64Image
  })
}

/**
 * Extract face descriptor from a URL
 * @param imageUrl - URL of the image
 * @returns Face descriptor or null
 */
export async function extractDescriptorFromUrl(
  imageUrl: string
): Promise<Float32Array | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = async () => {
      const descriptor = await extractFaceDescriptor(img)
      resolve(descriptor)
    }
    
    img.onerror = () => {
      console.error('Failed to load image from URL:', imageUrl)
      resolve(null)
    }
    
    img.src = imageUrl
  })
}

/**
 * Compare two face descriptors and return similarity score
 * @param descriptor1 - First face descriptor
 * @param descriptor2 - Second face descriptor
 * @returns Similarity score (0-1, higher is more similar)
 */
export async function compareFaces(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): Promise<number> {
  const api = await getFaceApi()
  
  // Calculate Euclidean distance
  const distance = api.euclideanDistance(descriptor1, descriptor2)
  
  // Convert distance to similarity score (0-1)
  // Distance of 0 = perfect match (similarity 1)
  // Distance of 0.6 or more = different person (similarity ~0)
  // Typical threshold is 0.4-0.5 for same person
  const similarity = Math.max(0, 1 - (distance / 0.6))
  
  return similarity
}

/**
 * Verify if two faces match
 * @param descriptor1 - First face descriptor
 * @param descriptor2 - Second face descriptor
 * @param threshold - Minimum similarity score to consider a match (default 0.5)
 * @returns Object with match result and confidence
 */
export async function verifyFaceMatch(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.5
): Promise<{ isMatch: boolean; confidence: number; distance: number }> {
  const api = await getFaceApi()
  
  const distance = api.euclideanDistance(descriptor1, descriptor2)
  const confidence = Math.max(0, Math.min(1, 1 - (distance / 0.6))) * 100
  
  // Lower distance = better match
  // Threshold of 0.4-0.5 is typical for face verification
  const isMatch = distance < (1 - threshold) * 0.6
  
  return {
    isMatch,
    confidence: Math.round(confidence),
    distance: Math.round(distance * 1000) / 1000
  }
}

/**
 * Serialize face descriptor to JSON-storable format
 */
export function serializeDescriptor(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

/**
 * Deserialize face descriptor from stored format
 */
export function deserializeDescriptor(data: number[]): Float32Array {
  return new Float32Array(data)
}

/**
 * Detect if there's a face in the video/image
 * @param imageSource - Image source to check
 * @returns Detection result with face bounds
 */
export async function detectFace(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<any | null> {
  if (!modelsLoaded) {
    const loaded = await loadModels()
    if (!loaded) return null
  }
  
  try {
    const api = await getFaceApi()
    
    const detection = await api.detectSingleFace(
      imageSource,
      new api.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      })
    )
    
    return detection || null
  } catch (error) {
    console.error('Error detecting face:', error)
    return null
  }
}
