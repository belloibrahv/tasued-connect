"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, CheckCircle, ArrowLeft, Loader2, RefreshCw, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Step = "intro" | "capture" | "confirm" | "success"

export default function EnrollFacePage() {
  const [step, setStep] = useState<Step>("intro")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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
  }, [])

  useEffect(() => {
    if (step === "capture") {
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [step, startCamera, stopCamera])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    
    if (!ctx) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Mirror the image for selfie view
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImage(imageData)
    setStep("confirm")
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setStep("capture")
  }

  const uploadPhoto = async () => {
    if (!capturedImage) return
    
    setIsUploading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      // Convert base64 to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      
      // Upload to Supabase Storage
      const fileName = `${user.id}/face-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from("face-photos")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true })
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("face-photos")
        .getPublicUrl(fileName)
      
      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_photo_url: publicUrl })
        .eq("id", user.id)
      
      if (updateError) throw updateError
      
      setStep("success")
      
    } catch (err: any) {
      setError(err.message || "Failed to save photo. Please try again.")
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
          <Link href="/student/dashboard" className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
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
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Register your face
                </h1>
                <p className="text-gray-500 text-sm">
                  We&apos;ll use your face to verify your identity when marking attendance. 
                  This is a one-time setup.
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 text-left space-y-3">
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
                </ul>
              </div>

              <Button 
                onClick={() => setStep("capture")} 
                className="w-full h-11 rounded-full font-medium"
              >
                Open Camera
              </Button>
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
                  <div className="w-48 h-60 border-2 border-white/50 rounded-[100px]" />
                </div>
                
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
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
                Position your face within the oval
              </p>

              <Button 
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-full h-11 rounded-full font-medium"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
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
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

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
                  className="flex-1 h-11 rounded-full font-medium"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm"
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

              <Button 
                onClick={() => router.push("/student/dashboard")}
                className="w-full h-11 rounded-full font-medium"
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
