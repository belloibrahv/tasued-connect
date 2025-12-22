"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, CheckCircle, ArrowLeft, Loader2, XCircle, Scan, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Step = "code" | "verify" | "success" | "failed"

export default function MarkAttendancePage() {
  const [step, setStep] = useState<Step>("code")
  const [sessionCode, setSessionCode] = useState("")
  const [session, setSession] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

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
  }, [])

  useEffect(() => {
    if (step === "verify") {
      startCamera()
    } else {
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
      setStep("verify")
      
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyFaceAndMark = async () => {
    if (!videoRef.current || !canvasRef.current || !session) return
    
    setIsVerifying(true)
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
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0)
      
      // In a real implementation, you would:
      // 1. Send the captured image to a face recognition API
      // 2. Compare with the enrolled face
      // 3. Return match confidence
      
      // For this demo, we'll simulate face verification
      // In production, integrate with a service like AWS Rekognition, 
      // Azure Face API, or a self-hosted solution
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      // Simulate 90% success rate for demo
      const isMatch = Math.random() > 0.1
      
      if (!isMatch) {
        setStep("failed")
        return
      }
      
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
      setError(err.message || "Verification failed")
    } finally {
      setIsVerifying(false)
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
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
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
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-gray-400" />
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
                  className="h-12 text-center text-lg font-mono tracking-widest uppercase"
                  maxLength={10}
                />
                
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={verifySession}
                  disabled={isVerifying || !sessionCode.trim()}
                  className="w-full h-11 rounded-full font-medium"
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

          {/* Face Verification Step */}
          {step === "verify" && session && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session</p>
                <p className="font-semibold text-gray-900">
                  {session.courses?.code} - {session.courses?.title}
                </p>
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
                  <div className="w-48 h-60 border-2 border-white/50 rounded-[100px]" />
                </div>
                
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                
                {isVerifying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
                    <p className="text-white text-sm">Verifying face...</p>
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <p className="text-center text-sm text-gray-500">
                Position your face and tap verify
              </p>

              <Button 
                onClick={verifyFaceAndMark}
                disabled={!cameraReady || isVerifying}
                className="w-full h-11 rounded-full font-medium"
              >
                <Camera className="w-4 h-4 mr-2" />
                Verify & Mark Present
              </Button>
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

              <Button 
                onClick={() => router.push("/student/dashboard")}
                className="w-full h-11 rounded-full font-medium"
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
                  We couldn&apos;t verify your face. Please try again with better lighting.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setStep("verify")}
                  className="w-full h-11 rounded-full font-medium"
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
