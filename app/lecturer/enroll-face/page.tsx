"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, CheckCircle, ArrowLeft, Loader2, RefreshCw, Scan, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  loadModels, 
  extractFaceDescriptor, 
  serializeDescriptor,
  detectFace 
} from "@/lib/face-recognition"

type Step = "intro" | "loading-models" | "capture" | "processing" | "confirm" | "success"

export default function LecturerEnrollFacePage() {
  const [step, setStep] = useState<Step>("intro")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // Load face recognition models
  const initializeModels = useCallback(async () => {
    setStep("loading-models")
    setError(null)
    
    try {
      console.log("Starting model initialization...")
      const loaded = await loadModels()
      console.log("Models loaded:", loaded)
      
      if (loaded) {
        setModelsReady(true)
        setStep("capture")
      } else {
        setError("Failed to load face recognition models. Please refresh and try again.")
        setStep("intro")
      }
    } catch (err) {
      console.error("Model loading error:", err)
      setError("Failed to initialize face recognition. Please try again.")
      setStep("intro")
    }
  }, [])

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
      setError("Camera access denied. Please allow camera access to continue.")
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

  // Real-time face detection for UI feedback
  useEffect(() => {
    if (step === "capture" && cameraReady && modelsReady && videoRef.current) {
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current) {
          try {
            const detection = await detectFace(videoRef.current)
            setFaceDetected(!!detection)
          } catch (err) {
            console.error("Face detection error:", err)
            setFaceDetected(false)
          }
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
    if (step === "capture") {
      startCamera()
    } else if (step !== "processing" && step !== "confirm") {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [step, startCamera, stopCamera])

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setStep("processing")
    setError(null)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    
    if (!ctx) return
    
    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw the video frame to canvas (without mirroring for face detection)
      ctx.drawImage(video, 0, 0)
      
      // Get the image data for display (mirrored for selfie view)
      const displayCanvas = document.createElement('canvas')
      displayCanvas.width = video.videoWidth
      displayCanvas.height = video.videoHeight
      const displayCtx = displayCanvas.getContext("2d")
      if (displayCtx) {
        displayCtx.translate(displayCanvas.width, 0)
        displayCtx.scale(-1, 1)
        displayCtx.drawImage(video, 0, 0)
      }
      
      const imageData = displayCanvas.toDataURL("image/jpeg", 0.9)
      setCapturedImage(imageData)
      
      // Extract face descriptor from the non-mirrored canvas
      const descriptor = await extractFaceDescriptor(canvas)
      
      if (!descriptor) {
        setError("No face detected. Please ensure your face is clearly visible and try again.")
        setStep("capture")
        return
      }
      
      setFaceDescriptor(descriptor)
      setStep("confirm")
      
    } catch (err) {
      console.error("Face extraction error:", err)
      setError("Failed to process face. Please try again with better lighting.")
      setStep("capture")
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setFaceDescriptor(null)
    setStep("capture")
  }

  const uploadPhoto = async () => {
    if (!capturedImage || !faceDescriptor) return
    
    setIsUploading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      // Serialize face descriptor for storage - this is the critical data
      const serializedDescriptor = serializeDescriptor(faceDescriptor)
      
      let publicUrl: string | null = null
      
      // Try to upload photo to storage (optional - face_descriptor is what matters)
      try {
        // Convert base64 data URL to blob
        const base64Data = capturedImage.split(',')[1] // Remove data:image/jpeg;base64, prefix
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/jpeg' })
        
        // Upload to Supabase Storage
        const fileName = `${user.id}/face-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from("face-photos")
          .upload(fileName, blob, { contentType: "image/jpeg", upsert: true })
        
        if (!uploadError) {
          // Get public URL
          const { data } = supabase.storage
            .from("face-photos")
            .getPublicUrl(fileName)
          publicUrl = data.publicUrl
          console.log("Photo uploaded successfully:", publicUrl)
        } else {
          console.warn("Photo upload failed (non-critical):", uploadError)
        }
      } catch (storageErr) {
        console.warn("Storage error (non-critical):", storageErr)
        // Continue without photo URL - face_descriptor is what matters
      }
      
      // Update user profile with face descriptor (required) and photo URL (optional)
      const updateData: any = { 
        face_descriptor: serializedDescriptor
      }
      
      if (publicUrl) {
        updateData.profile_photo_url = publicUrl
      }
      
      console.log("Saving face data to database:", {
        userId: user.id,
        hasFaceDescriptor: !!serializedDescriptor,
        hasPhotoUrl: !!publicUrl
      })
      
      // Ensure user profile exists before updating
      console.log("Checking if user profile exists for:", user.id)
      
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select('id')
        .eq("id", user.id)
        .single()
      
      if (fetchError || !existingUser) {
        console.log("User profile doesn't exist, creating via API...")
        
        const metadata = user.user_metadata || {}
        const role = metadata.role || 'lecturer'
        
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              role: role,
              first_name: metadata.first_name || 'User',
              last_name: metadata.last_name || 'User',
              matric_number: role === 'student' ? (metadata.matric_number || null) : null,
              staff_id: metadata.staff_id || null,
              department: metadata.department || null,
              level: role === 'student' ? (metadata.level || null) : null,
              title: metadata.title || null,
            })
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            console.error("Failed to create user profile:", result.error)
            throw new Error("Failed to create user profile for face enrollment")
          }
          
          console.log("User profile created successfully:", result)
        } catch (apiError) {
          console.error("API error creating profile:", apiError)
          throw new Error("Failed to create user profile for face enrollment")
        }
      }
      
      // Now update the user with face data
      console.log("About to update with data:", updateData)
      const { error: updateError, data: updateResult } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
      
      console.log("Update response:", { error: updateError, data: updateResult })
      
      if (updateError) {
        console.error("Database update error:", updateError)
        // Check if it's a column doesn't exist error
        if (updateError.message?.includes('face_descriptor') || updateError.code === '42703') {
          throw new Error("Database not configured. Please run the SQL migration in Supabase first.")
        }
        throw new Error(updateError.message || "Failed to save face data")
      }
      
      // Verify the update worked by fetching the user
      const { data: verifyData } = await supabase
        .from("users")
        .select('id, face_descriptor, profile_photo_url')
        .eq("id", user.id)
        .maybeSingle()
      
      console.log("Face enrollment verification:", {
        id: verifyData?.id,
        hasFaceDescriptor: !!verifyData?.face_descriptor,
        faceDescriptorType: typeof verifyData?.face_descriptor,
        faceDescriptorValue: verifyData?.face_descriptor,
        hasPhotoUrl: !!verifyData?.profile_photo_url,
        photoUrl: verifyData?.profile_photo_url
      })
      
      setStep("success")
      
    } catch (err: any) {
      setError(err.message || "Failed to save face data. Please try again.")
      console.error("Upload error:", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/lecturer/dashboard" className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Scan className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Enroll Face</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          
          {/* Intro Step */}
          {step === "intro" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-10 h-10 text-purple-600" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Register your face
                </h1>
                <p className="text-gray-500 text-sm">
                  We&apos;ll use AI-powered face recognition to verify your identity when marking attendance. 
                  This is a one-time setup.
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 text-left space-y-3">
                <h3 className="font-medium text-gray-900 text-sm">Tips for a good photo:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Good lighting on your face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Look directly at the camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Remove glasses or face coverings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Keep a neutral expression</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                onClick={initializeModels} 
                className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Open Camera
              </Button>
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
                  Initializing Face Recognition
                </h1>
                <p className="text-gray-500 text-sm">
                  Loading AI models... This may take a few seconds.
                </p>
              </div>
              
              <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Capture Step */}
          {step === "capture" && (
            <div className="space-y-4">
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
                  ? "Great! Your face is detected. Tap capture when ready."
                  : "Position your face within the oval"
                }
              </p>

              <Button 
                onClick={capturePhoto}
                disabled={!cameraReady || !faceDetected}
                className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="text-center space-y-6 py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Processing Face
                </h1>
                <p className="text-gray-500 text-sm">
                  Extracting facial features for recognition...
                </p>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === "confirm" && capturedImage && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={capturedImage} 
                  alt="Captured face" 
                  className="w-full h-full object-cover"
                />
                
                {/* Success badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 text-white">
                  ✓ Face Captured Successfully
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-900 text-sm">Face features extracted</p>
                    <p className="text-emerald-700 text-xs mt-1">
                      Your unique facial signature has been captured and will be used for attendance verification.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Is your face clearly visible?
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={isUploading}
                  className="flex-1 h-11 rounded-full font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  onClick={uploadPhoto}
                  disabled={isUploading}
                  className="flex-1 h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm & Save"
                  )}
                </Button>
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
                  Face enrolled!
                </h1>
                <p className="text-gray-500 text-sm">
                  You&apos;re all set. You can now mark attendance using face verification.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <p className="text-blue-900 text-sm font-medium">What&apos;s next?</p>
                <p className="text-blue-700 text-xs mt-1">
                  When your lecturer starts a session, enter the session code and verify your face to mark attendance.
                </p>
              </div>

              <Button 
                onClick={() => {
                  // Force a hard navigation to ensure fresh data
                  window.location.href = "/lecturer/dashboard";
                }}
                className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}