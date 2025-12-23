"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, CheckCircle, ArrowLeft, Loader2, XCircle, Scan, Hash, AlertCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  loadModels,
  extractFaceDescriptor,
  deserializeDescriptor,
  verifyFaceMatch,
  detectFace
} from "@/lib/face-recognition"

type Step = "code" | "loading-models" | "verify" | "verifying" | "success" | "failed"

export default function MarkAttendancePage() {
  const [step, setStep] = useState<Step>("code")
  const [sessionCode, setSessionCode] = useState("")
  const [session, setSession] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [enrolledDescriptor, setEnrolledDescriptor] = useState<Float32Array | null>(null)
  const [verificationResult, setVerificationResult] = useState<{ confidence: number } | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

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
      
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("face_descriptor, profile_photo_url")
        .eq("id", user.id)
        .single()
      
      if (userError) throw userError
      
      if (!userData?.face_descriptor) {
        setError("You haven't enrolled your face yet. Please enroll first.")
        setStep("code")
        router.push("/student/enroll-face")
        return
      }
      
      // Deserialize the stored descriptor
      const descriptor = deserializeDescriptor(userData.face_descriptor)
      setEnrolledDescriptor(descriptor)
      setModelsReady(true)
      setStep("verify")
      
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
    if (step === "verify") {
      startCamera()
    } else if (step !== "verifying") {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [step, startCamera, stopCamera])

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
        setError("You've already marked attendance for this session")
        return
      }
      
      setSession(sessionData)
      
      // Initialize face verification
      await initializeVerification()
      
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyFaceAndMark = async () => {
    if (!videoRef.current || !canvasRef.current || !session || !enrolledDescriptor) return
    
    setStep("verifying")
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      // Capture current frame
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      
      if (!ctx) throw new Error("Canvas error")
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      // Extract face descriptor from current frame
      const currentDescriptor = await extractFaceDescriptor(canvas)
      
      if (!currentDescriptor) {
        setError("No face detected. Please ensure your face is clearly visible.")
        setStep("verify")
        return
      }
      
      // Compare with enrolled face
      const result = await verifyFaceMatch(enrolledDescriptor, currentDescriptor, 0.5)
      
      console.log("Face verification result:", result)
      
      if (!result.isMatch) {
        setVerificationResult({ confidence: result.confidence })
        setStep("failed")
        return
      }
      
      setVerificationResult({ confidence: result.confidence })
      
      // Mark attendance
      const { error: attendanceError } = await supabase
        .from("attendance_records")
        .insert({
          session_id: session.id,
          student_id: user.id,
          course_id: session.course_id,
          status: "present",
          marking_method: "face",
          check_in_time: new Date().toTimeString().split(" ")[0]
        })
      
      if (attendanceError) throw attendanceError
      
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

          {/* Face Verification Step */}
          {step === "verify" && session && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session</p>
                <p className="font-semibold text-gray-900">
                  {session.courses?.code} - {session.courses?.title}
                </p>
                {session.topic && (
                  <p className="text-sm text-gray-500 mt-1">{session.topic}</p>
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
              
              <canvas ref={canvasRef} className="hidden" />
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-center text-sm text-gray-500">
                {faceDetected 
                  ? "Face detected! Tap verify to mark attendance."
                  : "Position your face within the oval"
                }
              </p>

              <Button 
                onClick={verifyFaceAndMark}
                disabled={!cameraReady || !faceDetected}
                className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify & Mark Present
              </Button>
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
