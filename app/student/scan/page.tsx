"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QRScanner } from "@/components/student/QRScanner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, QrCode, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

export default function ScanPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'scanning' | 'validating' | 'error'>('scanning')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleScanSuccess = async (decodedText: string) => {
    setStatus('validating')
    setError(null)

    try {
      // Extract the attendance code from QR data
      // QR code contains just the session code (e.g., "ABC123")
      const sessionCode = decodedText.trim().toUpperCase()
      
      if (!sessionCode || sessionCode.length < 4) {
        throw new Error("Invalid QR code format")
      }

      // Validate the session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('lecture_sessions')
        .select('id, session_code, status, courses(code, title)')
        .eq('session_code', sessionCode)
        .eq('status', 'active')
        .single()

      if (sessionError || !session) {
        throw new Error("Invalid or expired session code")
      }

      // Get course info (handle both array and object response)
      const courseInfo = Array.isArray(session.courses) 
        ? session.courses[0] 
        : session.courses

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please log in first")
        router.push('/login')
        return
      }

      // Check if already marked
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', user.id)
        .single()

      if (existingRecord) {
        toast.error("You've already marked attendance for this session")
        router.push('/student/dashboard')
        return
      }

      // Valid session found - redirect to mark-attendance with code pre-filled
      toast.success(`Session found: ${courseInfo?.code || 'Course'}`)
      router.push(`/student/mark-attendance?code=${sessionCode}`)

    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Failed to process QR code')
      toast.error(err.message || 'Invalid QR code')
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
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Scan QR Code</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Instructions */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Scan Attendance QR
            </h1>
            <p className="text-gray-500 text-sm">
              Point your camera at the QR code displayed by your lecturer
            </p>
          </div>

          {/* Scanner */}
          {status === 'scanning' && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 overflow-hidden">
              <QRScanner onScanSuccess={handleScanSuccess} />
            </div>
          )}

          {/* Validating */}
          {status === 'validating' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <p className="font-medium text-gray-900">Validating session...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="font-medium text-red-900">{error}</p>
              </div>
              
              <Button 
                onClick={() => {
                  setStatus('scanning')
                  setError(null)
                  window.location.reload()
                }}
                className="w-full h-11 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Alternative */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500 mb-2">Or enter code manually</p>
            <Link href="/student/mark-attendance">
              <Button variant="outline" className="rounded-full">
                Enter Code
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
