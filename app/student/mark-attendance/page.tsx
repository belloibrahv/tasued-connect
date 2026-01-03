"use client"

import { useState, useRef, useCallback, useEffect, Suspense } from "react"
import { CheckCircle, ArrowLeft, Loader2, XCircle, Scan, Hash, AlertCircle, ShieldCheck, MapPin, Navigation, Eye, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  loadModels,
  extractFaceDescriptor,
  deserializeDescriptor,
  verifyFaceMatch,
  detectFace
} from "@/lib/face-recognition"
import {
  getCurrentLocation,
  verifyLocation,
  type Coordinates,
  type LocationVerificationResult
} from "@/lib/geolocation"
import {
  getRandomChallenge,
  getChallengeInstruction,
  performLivenessCheck,
  resetLivenessState,
  type LivenessChallenge
} from "@/lib/liveness-detection"

type Step = "code" | "loading-models" | "location" | "liveness" | "verify" | "verifying" | "success" | "failed"

// Wrapper component to handle Suspense for useSearchParams
export default function MarkAttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    }>
      <MarkAttendanceContent />
    </Suspense>
  )
}

function MarkAttendanceContent() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('code') || ""
  
  const [step, setStep] = useState<Step>("code")
  const [sessionCode, setSessionCode] = useState(initialCode)
  const [session, setSession] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [enrolledDescriptor, setEnrolledDescriptor] = useState<Float32Array | null>(null)
  const [verificationResult, setVerificationResult] = useState<{ confidence: number } | null>(null)
  const [studentLocation, setStudentLocation] = useState<Coordinates | null>(null)
  const [locationResult, setLocationResult] = useState<LocationVerificationResult | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [livenessChallenge, setLivenessChallenge] = useState<LivenessChallenge | null>(null)
  const [livenessProgress, setLivenessProgress] = useState(0)
  const [livenessPassed, setLivenessPassed] = useState(false)
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // Helper function to format time remaining
  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m remaining`
    }
    
    return `${minutes}m ${seconds}s remaining`
  }

  // Update time remaining countdown
  useEffect(() => {
    if (!codeExpiresAt) return
    
    const updateTimer = () => {
      const remaining = formatTimeRemaining(codeExpiresAt)
      setTimeRemaining(remaining)
      
      // Check if expired
      if (remaining === "Expired") {
        setError("Session code has expired. Please ask your lecturer for a new code.")
        setStep("code")
        setSession(null)
        setCodeExpiresAt(null)
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [codeExpiresAt])

  // Auto-verify if code is provided via URL (from QR scan)
  useEffect(() => {
    if (initialCode && step === "code") {
      verifySession()
    }
  }, [initialCode])

  // Load models and get enrolled face descriptor
  const initializeVerification = useCallback(async () => {
    setStep("loading-models")
    setError(null)
    
    try {
      // Load face recognition models
      const loaded = await loadModels()
      if (!loaded) {
        setError("Failed to load face recognition. Please refresh and try again.")
        setStep("code")
        return
      }
      
      // Get user's enrolled face descriptor
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      console.log("Fetching enrolled face descriptor for user:", user.id)
      
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("face_descriptor, profile_photo_url")
        .eq("id", user.id)
        .single()
      
      // If user doesn't exist in public.users, create them via API (bypasses RLS)
      if (userError || !userData) {
        console.log("User not found in public.users, creating via API...")
        
        const metadata = user.user_metadata || {}
        const role = metadata.role || 'student'
        
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              role: role,
              first_name: metadata.first_name || 'Student',
              last_name: metadata.last_name || 'User',
              matric_number: metadata.matric_number || `TEMP-${user.id.substring(0, 8)}`,
              staff_id: role === 'lecturer' ? (metadata.staff_id || `STF-${user.id.substring(0, 8)}`) : null,
              department: metadata.department || null,
              level: metadata.level || null,
              title: role === 'lecturer' ? (metadata.title || null) : null,
            })
          })
          
          const result = await response.json()
          
          if (response.ok) {
            console.log("User profile created successfully:", result)
            // Re-fetch the user data
            const { data: newUserData } = await supabase
              .from('users')
              .select('face_descriptor, profile_photo_url')
              .eq('id', user.id)
              .single()
            userData = newUserData
          } else {
            console.error("API error creating profile:", result.error)
            throw new Error(result.error || "Failed to create user profile")
          }
        } catch (apiError) {
          console.error("Failed to create profile via API:", apiError)
          throw apiError
        }
      }
      
      if (!userData) {
        throw new Error("Failed to get user data")
      }
      
      console.log("User data fetched:", {
        hasFaceDescriptor: !!userData?.face_descriptor,
        descriptorType: typeof userData?.face_descriptor,
        descriptorLength: Array.isArray(userData?.face_descriptor) ? userData.face_descriptor.length : 'not array'
      })
      
      if (!userData?.face_descriptor) {
        setError("You have not enrolled your face yet. Please enroll first.")
        setStep("code")
        router.push("/student/enroll-face")
        return
      }
      
      // Deserialize the stored descriptor
      const descriptor = deserializeDescriptor(userData.face_descriptor)
      console.log("Deserialized descriptor:", {
        type: descriptor.constructor.name,
        length: descriptor.length,
        sample: Array.from(descriptor.slice(0, 5))
      })
      
      setEnrolledDescriptor(descriptor)
      setModelsReady(true)
      
      // Go to liveness detection step
      setStep("liveness")
      
    } catch (err: any) {
      console.error("Initialization error:", err)
      setError(err.message || "Failed to initialize verification")
      setStep("code")
    }
  }, [supabase, router])

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraReady(true)
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera access.")
      console.error("Camera error:", err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setCameraReady(false)
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }, [])

  // Real-time face detection
  useEffect(() => {
    if (step === "verify" && cameraReady && modelsReady && videoRef.current) {
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current) {
          const detection = await detectFace(videoRef.current)
          setFaceDetected(!!detection)
        }
      }, 500)
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [step, cameraReady, modelsReady])

  useEffect(() => {
    if (step === "verify" || step === "liveness") {
      startCamera()
    } else if (step !== "verifying") {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [step, startCamera, stopCamera])

  // Start liveness check when entering liveness step
  useEffect(() => {
    if (step === "liveness" && cameraReady && videoRef.current) {
      startLivenessCheck()
    }
  }, [step, cameraReady])

  const startLivenessCheck = async () => {
    if (!videoRef.current) return
    
    // Get a random challenge
    const challenge = getRandomChallenge()
    setLivenessChallenge(challenge)
    setLivenessProgress(0)
    setError(null)
    
    // Wait a moment for user to see the instruction
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Perform the liveness check
    const passed = await performLivenessCheck(
      videoRef.current,
      challenge,
      (progress) => setLivenessProgress(progress)
    )
    
    if (passed) {
      setLivenessPassed(true)
      // Short delay to show success, then move to face verification
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStep("verify")
    } else {
      setError("Liveness check failed. Please follow the instruction and try again.")
      setLivenessChallenge(null)
    }
  }

  const retryLivenessCheck = () => {
    setError(null)
    setLivenessPassed(false)
    resetLivenessState()
    startLivenessCheck()
  }

  const verifySession = async () => {
    if (!sessionCode.trim()) {
      setError("Please enter a session code")
      return
    }
    
    setError(null)
    setIsVerifying(true)
    
    try {
      // Find the session by code
      const { data: sessionData, error: sessionError } = await supabase
        .from("lecture_sessions")
        .select("*, courses(code, title)")
        .eq("attendance_code", sessionCode.toUpperCase())
        .eq("status", "active")
        .single()
      
      if (sessionError || !sessionData) {
        setError("Invalid or expired session code")
        return
      }
      
      // Check if session code has expired
      if (sessionData.code_expires_at) {
        const expiresAt = new Date(sessionData.code_expires_at)
        if (expiresAt < new Date()) {
          setError("Session code has expired. Please ask your lecturer for a new code.")
          return
        }
        // Set expiration time for countdown display
        setCodeExpiresAt(expiresAt)
      }
      
      // Check if already marked
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("session_id", sessionData.id)
        .eq("student_id", user.id)
        .single()
      
      if (existingRecord) {
        setError("You have already marked attendance for this session")
        return
      }
      
      setSession(sessionData)
      
      // Check if location verification is required
      const hasLocationRequirement = sessionData.location_latitude && sessionData.location_longitude
      
      if (hasLocationRequirement) {
        // Go to location verification step first
        setStep("location")
      } else {
        // Skip to face verification
        await initializeVerification()
      }
      
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyStudentLocation = async () => {
    if (!session) return
    
    setIsGettingLocation(true)
    setError(null)
    
    try {
      const location = await getCurrentLocation()
      setStudentLocation(location)
      
      const classLocation: Coordinates = {
        latitude: session.location_latitude,
        longitude: session.location_longitude
      }
      
      const result = verifyLocation(
        location,
        classLocation,
        session.location_radius || 100
      )
      
      setLocationResult(result)
      
      if (!result.isWithinRange) {
        setError(`You are ${result.distance}m away from the class. You must be within ${session.location_radius || 100}m to mark attendance.`)
        return
      }
      
      // Location verified, proceed to face verification
      await initializeVerification()
      
    } catch (err: any) {
      setError(err.message || "Failed to get your location")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const verifyFaceAndMark = async () => {
    if (!videoRef.current || !session || !enrolledDescriptor) {
      console.error("Missing required data:", { 
        hasVideo: !!videoRef.current, 
        hasSession: !!session, 
        hasDescriptor: !!enrolledDescriptor 
      })
      setError("Missing required data. Please try again.")
      return
    }
    
    // Don't change step yet - we need the video element to capture the frame
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      // Capture current frame BEFORE changing step
      const video = videoRef.current
      
      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext("2d")
      
      if (!ctx) throw new Error("Canvas context error")
      
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx.drawImage(video, 0, 0)
      
      console.log("Frame captured, dimensions:", {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      })
      
      // NOW change to verifying step (video can be unmounted)
      setStep("verifying")
      
      console.log("Extracting face from captured frame...")
      
      // Extract face descriptor from current frame
      const currentDescriptor = await extractFaceDescriptor(canvas)
      
      if (!currentDescriptor) {
        console.error("No face detected in captured frame")
        setError("No face detected in the captured image. Please ensure good lighting and try again.")
        setStep("verify")
        return
      }
      
      console.log("Face extracted, comparing with enrolled face...")
      
      // Compare with enrolled face - using lower threshold (0.4) for more lenient matching
      const result = await verifyFaceMatch(enrolledDescriptor, currentDescriptor, 0.4)
      
      console.log("Face verification result:", result)
      
      if (!result.isMatch) {
        console.log("Face match failed - confidence too low")
        setVerificationResult({ confidence: result.confidence })
        setStep("failed")
        return
      }
      
      console.log("Face matched! Marking attendance...")
      setVerificationResult({ confidence: result.confidence })
      
      // Mark attendance
      const attendanceData: any = {
        session_id: session.id,
        student_id: user.id,
        course_id: session.course_id,
        status: "present",
        marking_method: "face",  // Valid values: 'qr', 'manual', 'system', 'face'
        check_in_time: new Date().toTimeString().split(" ")[0]
      }
      
      // Add location data if verified
      if (studentLocation && locationResult) {
        attendanceData.location_latitude = studentLocation.latitude
        attendanceData.location_longitude = studentLocation.longitude
        attendanceData.location_accuracy = studentLocation.accuracy
        attendanceData.location_distance = locationResult.distance
        attendanceData.location_verified = locationResult.isWithinRange
      }
      
      console.log("Inserting attendance record:", attendanceData)
      
      const { data: insertedRecord, error: attendanceError } = await supabase
        .from("attendance_records")
        .insert(attendanceData)
        .select()
      
      if (attendanceError) {
        console.error("Attendance insert error:", attendanceError)
        // Check for common errors
        if (attendanceError.code === '23505') {
          setError("You have already marked attendance for this session")
          setStep("code")
          return
        }
        if (attendanceError.code === '42501') {
          setError("Permission denied. Please contact support.")
          setStep("code")
          return
        }
        throw new Error(attendanceError.message || "Failed to mark attendance")
      }
      
      console.log("Attendance marked successfully:", insertedRecord)
      setStep("success")
      
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(err.message || "Verification failed")
      setStep("verify")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/student/dashboard" className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Scan className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Mark Attendance</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          
          {/* Code Entry Step */}
          {step === "code" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Enter session code
                </h1>
                <p className="text-gray-500 text-sm">
                  Get the code from your lecturer to mark attendance
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  className="h-12 text-center text-lg font-mono tracking-widest uppercase rounded-xl"
                  maxLength={10}
                />
                
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button 
                  onClick={verifySession}
                  disabled={isVerifying || !sessionCode.trim()}
                  className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-2 text-gray-400">or</span>
                  </div>
                </div>

                <Link href="/student/scan">
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-full font-medium"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Loading Models Step */}
          {step === "loading-models" && (
            <div className="text-center space-y-6 py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Preparing Verification
                </h1>
                <p className="text-gray-500 text-sm">
                  Loading face recognition models...
                </p>
              </div>
            </div>
          )}

          {/* Location Verification Step */}
          {step === "location" && session && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session</p>
                <p className="font-semibold text-gray-900">
                  {session.courses?.code} - {session.courses?.title}
                </p>
                {session.venue && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {session.venue}
                  </p>
                )}
                {timeRemaining && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⏱ Code expires: {timeRemaining}
                  </p>
                )}
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Verify Your Location
                </h1>
                <p className="text-gray-500 text-sm">
                  We need to confirm you&apos;re physically in the classroom.
                  You must be within {session.location_radius || 100}m of the venue.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Location verification failed</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              )}

              {locationResult && !locationResult.isWithinRange && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-900 text-sm font-medium mb-2">You&apos;re too far from the class</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">Your distance:</span>
                    <span className="font-mono font-bold text-amber-900">{locationResult.distance}m</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-amber-700">Required:</span>
                    <span className="font-mono text-amber-900">≤ {session.location_radius || 100}m</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={verifyStudentLocation}
                disabled={isGettingLocation}
                className="w-full h-12 rounded-full font-medium bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    {locationResult ? "Try Again" : "Verify My Location"}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-400">
                Make sure location services are enabled on your device
              </p>
            </div>
          )}

          {/* Liveness Detection Step */}
          {step === "liveness" && session && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session</p>
                <p className="font-semibold text-gray-900">
                  {session.courses?.code} - {session.courses?.title}
                </p>
                {timeRemaining && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⏱ Code expires: {timeRemaining}
                  </p>
                )}
              </div>

              {/* Liveness Challenge Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Eye className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Liveness Check</p>
                    <p className="text-xs text-amber-700">Prove you&apos;re a real person</p>
                  </div>
                </div>
                
                {livenessChallenge && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-center font-medium text-gray-900">
                      {getChallengeInstruction(livenessChallenge)}
                    </p>
                  </div>
                )}
              </div>

              <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-48 h-60 border-2 rounded-[100px] transition-colors duration-300 ${
                    livenessPassed ? 'border-emerald-400 shadow-lg shadow-emerald-400/30' : 'border-amber-400 shadow-lg shadow-amber-400/30'
                  }`} />
                </div>
                
                {/* Progress indicator */}
                {livenessChallenge && !livenessPassed && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/50 rounded-full p-1">
                      <div 
                        className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-100"
                        style={{ width: `${livenessProgress * 100}%` }}
                      />
                    </div>
                    <p className="text-center text-white text-xs mt-2">
                      {Math.round(livenessProgress * 100)}% - Analyzing...
                    </p>
                  </div>
                )}
                
                {/* Success indicator */}
                {livenessPassed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-emerald-500 rounded-full p-4">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                )}
                
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {error && (
                <Button 
                  onClick={retryLivenessCheck}
                  className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-amber-500 to-orange-500"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}

              {!livenessChallenge && !error && (
                <p className="text-center text-sm text-gray-500">
                  Preparing liveness check...
                </p>
              )}
            </div>
          )}

          {/* Face Verification Step */}
          {step === "verify" && session && (
            <div className="space-y-4 pb-8">
              {/* Hidden canvas for face capture - must be rendered */}
              <canvas ref={canvasRef} className="hidden" width={640} height={480} />
              
              {/* Session Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session</p>
                <p className="font-semibold text-gray-900">
                  {session.courses?.code} - {session.courses?.title}
                </p>
                {session.topic && (
                  <p className="text-sm text-gray-500 mt-1">{session.topic}</p>
                )}
                {timeRemaining && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⏱ Code expires: {timeRemaining}
                  </p>
                )}
              </div>

              {/* Verification Button - Moved to top for visibility */}
              <Button 
                onClick={verifyFaceAndMark}
                disabled={!cameraReady || !faceDetected}
                className="w-full h-12 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 text-base"
              >
                <ShieldCheck className="w-5 h-5 mr-2" />
                {faceDetected ? "Verify & Mark Present" : "Detecting face..."}
              </Button>

              <div className="relative aspect-[4/5] bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-48 h-60 border-2 rounded-[100px] transition-colors duration-300 ${
                    faceDetected ? 'border-emerald-400 shadow-lg shadow-emerald-400/30' : 'border-white/50'
                  }`} />
                </div>
                
                {/* Face detection indicator */}
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  faceDetected 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-black/50 text-white/70'
                }`}>
                  {faceDetected ? '✓ Face Detected' : 'Position your face'}
                </div>
                
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-center text-sm text-gray-500">
                {faceDetected 
                  ? "Face detected! Tap the button above to mark attendance."
                  : "Position your face within the oval"
                }
              </p>
            </div>
          )}

          {/* Verifying Step */}
          {step === "verifying" && (
            <div className="text-center space-y-6 py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Verifying Identity
                </h1>
                <p className="text-gray-500 text-sm">
                  Comparing your face with enrolled data...
                </p>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Attendance marked!
                </h1>
                <p className="text-gray-500 text-sm">
                  You&apos;ve been marked present for {session?.courses?.code}
                </p>
              </div>

              <div className="space-y-3">
                {verificationResult && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-900">
                        Face Match: {verificationResult.confidence}% confidence
                      </span>
                    </div>
                  </div>
                )}

                {livenessPassed && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-900">
                        Liveness Verified ✓
                      </span>
                    </div>
                  </div>
                )}

                {locationResult && locationResult.isWithinRange && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Location Verified: {locationResult.distance}m from class
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => router.push("/student/dashboard")}
                className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Back to Dashboard
              </Button>
            </div>
          )}

          {/* Failed Step */}
          {step === "failed" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Verification failed
                </h1>
                <p className="text-sm text-gray-500">
                  Your face didn&apos;t match the enrolled data.
                </p>
              </div>

              {verificationResult && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-900 text-sm">
                    Match confidence: {verificationResult.confidence}% (minimum 50% required)
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-amber-900 text-sm font-medium mb-2">Tips for better verification:</p>
                <ul className="text-amber-700 text-xs space-y-1">
                  <li>• Ensure good lighting on your face</li>
                  <li>• Remove glasses or face coverings</li>
                  <li>• Look directly at the camera</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setStep("verify")}
                  className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/student/dashboard")}
                  className="w-full h-11 rounded-full font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
