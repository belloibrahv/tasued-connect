/**
 * Liveness Detection Module
 * Prevents spoofing attacks by requiring user interaction
 * 
 * Techniques used:
 * 1. Blink Detection - User must blink naturally
 * 2. Head Movement - User must turn head slightly
 * 3. Random Challenge - User follows on-screen prompts
 */

import { detectFace, loadModels } from '@/lib/face-recognition'

export type LivenessChallenge = 'blink' | 'turn-left' | 'turn-right' | 'nod' | 'smile'

export interface LivenessResult {
  isLive: boolean
  confidence: number
  challengesPassed: number
  totalChallenges: number
  message: string
}

export interface FacePosition {
  x: number
  y: number
  width: number
  height: number
}

export interface BlinkDetectionResult {
  detected: boolean
  confidence: number
  variance: number
  threshold: number
}

/**
 * Configurable thresholds for liveness detection
 * These can be adjusted based on camera quality and environment
 */
export const LIVENESS_CONFIG = {
  // Blink detection: variance threshold as percentage of average face height
  // Lower = more sensitive, Higher = less sensitive
  // Default 2% works for most cameras, increase to 3-4% for lower quality cameras
  blinkVarianceThreshold: 0.02,
  
  // Movement detection: threshold as percentage of face width
  // Lower = more sensitive to small movements
  movementThreshold: 0.15,
  
  // Maximum frames to check (at ~30fps)
  maxAttempts: 60,
  
  // Minimum positions needed before detection starts
  minPositionHistory: 3,
  
  // Maximum positions to keep in history
  maxPositionHistory: 10,
  
  // Number of recent positions to use for variance calculation
  recentPositionsForVariance: 5,
}

// Track face positions for movement detection
let previousFacePositions: FacePosition[] = []
let blinkDetected = false
let movementDetected = false

/**
 * Get a random liveness challenge
 */
export function getRandomChallenge(): LivenessChallenge {
  const challenges: LivenessChallenge[] = ['blink', 'turn-left', 'turn-right']
  return challenges[Math.floor(Math.random() * challenges.length)]
}

/**
 * Get challenge instruction text
 */
export function getChallengeInstruction(challenge: LivenessChallenge): string {
  switch (challenge) {
    case 'blink':
      return 'Please blink your eyes'
    case 'turn-left':
      return 'Turn your head slightly left'
    case 'turn-right':
      return 'Turn your head slightly right'
    case 'nod':
      return 'Nod your head up and down'
    case 'smile':
      return 'Please smile'
    default:
      return 'Follow the instruction'
  }
}

/**
 * Reset liveness detection state
 */
export function resetLivenessState(): void {
  previousFacePositions = []
  blinkDetected = false
  movementDetected = false
}

/**
 * Detect face position from video frame
 */
export async function detectFacePosition(
  videoElement: HTMLVideoElement
): Promise<FacePosition | null> {
  const detection = await detectFace(videoElement)
  
  if (!detection) return null
  
  return {
    x: detection.box.x,
    y: detection.box.y,
    width: detection.box.width,
    height: detection.box.height
  }
}

/**
 * Check if face has moved significantly (for turn detection)
 */
export function checkFaceMovement(
  currentPosition: FacePosition,
  direction: 'left' | 'right'
): boolean {
  if (previousFacePositions.length < LIVENESS_CONFIG.minPositionHistory) {
    previousFacePositions.push(currentPosition)
    return false
  }
  
  // Calculate average position from history
  const avgX = previousFacePositions.reduce((sum, p) => sum + p.x, 0) / previousFacePositions.length
  
  // Check if face moved in the expected direction (using configurable threshold)
  const movementThreshold = currentPosition.width * LIVENESS_CONFIG.movementThreshold
  
  if (direction === 'left' && currentPosition.x < avgX - movementThreshold) {
    movementDetected = true
    return true
  }
  
  if (direction === 'right' && currentPosition.x > avgX + movementThreshold) {
    movementDetected = true
    return true
  }
  
  // Update history (keep last N positions)
  previousFacePositions.push(currentPosition)
  if (previousFacePositions.length > LIVENESS_CONFIG.maxPositionHistory) {
    previousFacePositions.shift()
  }
  
  return false
}

/**
 * Simple blink detection using face size changes
 * When eyes close, the detected face box often changes slightly
 * Returns detection result with confidence information
 */
export function checkBlinkPattern(
  currentPosition: FacePosition
): boolean {
  if (previousFacePositions.length < LIVENESS_CONFIG.minPositionHistory) {
    previousFacePositions.push(currentPosition)
    return false
  }
  
  // Check for height variation (eyes closing causes slight changes)
  const recentPositions = previousFacePositions.slice(-LIVENESS_CONFIG.recentPositionsForVariance)
  const heights = recentPositions.map(p => p.height)
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length
  const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length
  
  // If there's noticeable variance, likely a blink occurred (using configurable threshold)
  const blinkThreshold = avgHeight * LIVENESS_CONFIG.blinkVarianceThreshold
  
  if (variance > blinkThreshold && !blinkDetected) {
    blinkDetected = true
    return true
  }
  
  previousFacePositions.push(currentPosition)
  if (previousFacePositions.length > LIVENESS_CONFIG.maxPositionHistory) {
    previousFacePositions.shift()
  }
  
  return false
}

/**
 * Enhanced blink detection with confidence reporting
 * Useful for debugging and user feedback
 */
export function checkBlinkPatternWithConfidence(
  currentPosition: FacePosition
): BlinkDetectionResult {
  if (previousFacePositions.length < LIVENESS_CONFIG.minPositionHistory) {
    previousFacePositions.push(currentPosition)
    return { detected: false, confidence: 0, variance: 0, threshold: 0 }
  }
  
  const recentPositions = previousFacePositions.slice(-LIVENESS_CONFIG.recentPositionsForVariance)
  const heights = recentPositions.map(p => p.height)
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length
  const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length
  
  const blinkThreshold = avgHeight * LIVENESS_CONFIG.blinkVarianceThreshold
  const confidence = Math.min((variance / blinkThreshold) * 100, 100)
  
  const detected = variance > blinkThreshold && !blinkDetected
  
  if (detected) {
    blinkDetected = true
  }
  
  previousFacePositions.push(currentPosition)
  if (previousFacePositions.length > LIVENESS_CONFIG.maxPositionHistory) {
    previousFacePositions.shift()
  }
  
  return {
    detected,
    confidence,
    variance,
    threshold: blinkThreshold
  }
}

/**
 * Perform liveness check with multiple frames
 * Returns true if liveness is confirmed
 */
export async function performLivenessCheck(
  videoElement: HTMLVideoElement,
  challenge: LivenessChallenge,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  await loadModels()
  resetLivenessState()
  
  const maxAttempts = LIVENESS_CONFIG.maxAttempts
  let attempts = 0
  let challengePassed = false
  
  return new Promise((resolve) => {
    const checkFrame = async () => {
      if (attempts >= maxAttempts) {
        resolve(challengePassed)
        return
      }
      
      const position = await detectFacePosition(videoElement)
      
      if (!position) {
        attempts++
        onProgress?.(attempts / maxAttempts)
        requestAnimationFrame(checkFrame)
        return
      }
      
      // Check based on challenge type
      switch (challenge) {
        case 'blink':
          if (checkBlinkPattern(position)) {
            challengePassed = true
          }
          break
        case 'turn-left':
          if (checkFaceMovement(position, 'left')) {
            challengePassed = true
          }
          break
        case 'turn-right':
          if (checkFaceMovement(position, 'right')) {
            challengePassed = true
          }
          break
      }
      
      if (challengePassed) {
        resolve(true)
        return
      }
      
      attempts++
      onProgress?.(attempts / maxAttempts)
      requestAnimationFrame(checkFrame)
    }
    
    checkFrame()
  })
}

/**
 * Run full liveness verification with multiple challenges
 */
export async function verifyLiveness(
  videoElement: HTMLVideoElement,
  numChallenges: number = 2,
  onChallengeStart?: (challenge: LivenessChallenge, index: number) => void,
  onChallengeComplete?: (passed: boolean, index: number) => void
): Promise<LivenessResult> {
  let challengesPassed = 0
  const challenges: LivenessChallenge[] = []
  
  // Generate unique challenges
  const availableChallenges: LivenessChallenge[] = ['blink', 'turn-left', 'turn-right']
  for (let i = 0; i < numChallenges; i++) {
    const randomIndex = Math.floor(Math.random() * availableChallenges.length)
    challenges.push(availableChallenges[randomIndex])
    availableChallenges.splice(randomIndex, 1)
    if (availableChallenges.length === 0) break
  }
  
  // Run each challenge
  for (let i = 0; i < challenges.length; i++) {
    const challenge = challenges[i]
    onChallengeStart?.(challenge, i)
    
    resetLivenessState()
    const passed = await performLivenessCheck(videoElement, challenge)
    
    if (passed) {
      challengesPassed++
    }
    
    onChallengeComplete?.(passed, i)
    
    // Small delay between challenges
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  const confidence = (challengesPassed / challenges.length) * 100
  const isLive = challengesPassed >= Math.ceil(challenges.length * 0.5) // Pass if 50%+ challenges completed
  
  return {
    isLive,
    confidence,
    challengesPassed,
    totalChallenges: challenges.length,
    message: isLive 
      ? `Liveness verified (${challengesPassed}/${challenges.length} challenges passed)`
      : `Liveness check failed (${challengesPassed}/${challenges.length} challenges passed)`
  }
}

/**
 * Quick liveness check - single challenge
 */
export async function quickLivenessCheck(
  videoElement: HTMLVideoElement
): Promise<{ isLive: boolean; challenge: LivenessChallenge }> {
  const challenge = getRandomChallenge()
  resetLivenessState()
  
  const passed = await performLivenessCheck(videoElement, challenge)
  
  return {
    isLive: passed,
    challenge
  }
}

/**
 * Get a different challenge than the one provided
 * Useful for retry scenarios where the user failed a specific challenge
 */
export function getDifferentChallenge(currentChallenge: LivenessChallenge): LivenessChallenge {
  const allChallenges: LivenessChallenge[] = ['blink', 'turn-left', 'turn-right']
  const otherChallenges = allChallenges.filter(c => c !== currentChallenge)
  return otherChallenges[Math.floor(Math.random() * otherChallenges.length)]
}

/**
 * Update liveness configuration at runtime
 * Useful for adjusting sensitivity based on environment
 */
export function updateLivenessConfig(updates: Partial<typeof LIVENESS_CONFIG>): void {
  Object.assign(LIVENESS_CONFIG, updates)
}
