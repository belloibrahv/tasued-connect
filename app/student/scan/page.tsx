"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { QRScanner } from "@/components/student/QRScanner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function ScanPage() {
  const router = useRouter()
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleScanSuccess = async (decodedText: string) => {
    setScanResult(decodedText)
    setStatus('processing')

    try {
      const { markAttendance } = await import("./actions")
      const result = await markAttendance(decodedText)

      setStatus('success')
      setMessage(`Attendance marked successfully for ${result.courseCode}: ${result.topic}`)
      toast.success('Attendance marked successfully!')

    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Invalid QR code or session expired.')
      toast.error(error.message || 'Failed to mark attendance.')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/student/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Scan Attendance</h1>
          <p className="text-muted-foreground">Scan the QR code displayed by your lecturer</p>
        </div>
      </div>

      <Card className="border-2 border-dashed shadow-sm">
        <CardContent className="pt-6">
          {status === 'idle' && (
            <QRScanner onScanSuccess={handleScanSuccess} />
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-medium animate-pulse">Verifying location and marking attendance...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Checked In!</h3>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Link href="/student/dashboard" className="w-full">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Scan Another
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Check In Failed</h3>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
