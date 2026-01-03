"use client"

import { useState, useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { ShieldCheck, XCircle, Loader2, User, ChevronLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { BioPassCard } from "@/components/student/BioPassCard"
import Link from "next/link"

export default function LecturerVerifyPage() {
  const [scanResult, setScanResult] = useState<any>(null)
  const [studentData, setStudentData] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function onScanSuccess(decodedText: string) {
    setIsScanning(false)
    setIsLoading(true)
    setError(null)

    try {
      const parsed = JSON.parse(decodedText)
      if (!parsed.id) throw new Error("Invalid Bio-Pass Format")

      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('matric_number', parsed.id)
        .single()

      if (dbError || !data) throw new Error("Student record not found or invalid.")

      setStudentData(data)
      setScanResult(parsed)
    } catch (err: any) {
      setError(err.message || "Failed to verify Bio-Pass")
      setScanResult({ error: true })
    } finally {
      setIsLoading(false)
    }
  }

  function onScanError(err: any) {
    // We can ignore most scan errors as they occur continuously until successful scan
  }

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null

    if (isScanning && !scanResult) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scanner.render(onScanSuccess, onScanError)
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner clear error:", err))
      }
    }
  }, [isScanning, scanResult])

  const resetScanner = () => {
    setScanResult(null)
    setStudentData(null)
    setIsScanning(true)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/lecturer/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Bio-Pass Verification</h1>
        </div>

        {!scanResult && !error && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-2 border-primary/10 shadow-xl rounded-3xl">
              <CardHeader className="bg-primary/5 pb-6">
                <CardTitle className="text-center text-primary flex items-center justify-center gap-2">
                  <ShieldCheck className="w-6 h-6" />
                  Scanner Active
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div id="reader" className="w-full h-[400px]"></div>
                <div className="p-6 text-center space-y-2">
                  <p className="font-bold text-gray-900">Position the student&apos;s QR code within the frame</p>
                  <p className="text-sm text-gray-500">The Bio-Pass will be verified against the official database 100%.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary/40" />
              </div>
            </div>
            <p className="mt-4 font-bold text-primary animate-pulse">Verifying Identity...</p>
          </div>
        )}

        {scanResult && studentData && !isLoading && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900">Verified Successfully</h2>
                <p className="text-gray-500 font-medium">Record match found in TASUED database.</p>
              </div>
            </div>

            <BioPassCard user={studentData} />

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={resetScanner} className="w-full rounded-2xl h-14 font-bold gap-2">
                <RefreshCw className="w-5 h-5" />
                Scan Another
              </Button>
              <Button variant="outline" className="w-full rounded-2xl h-14 font-bold" asChild>
                <Link href="/lecturer/dashboard">Done</Link>
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-8 animate-in zoom-in duration-300">
            <Card className="border-red-100 bg-red-50/30 rounded-3xl overflow-hidden pt-8">
              <CardContent className="flex flex-col items-center text-center p-8">
                <XCircle className="w-20 h-20 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">Verification Failed</h2>
                <p className="text-red-700 font-medium mb-8">{error}</p>
                <Button onClick={resetScanner} variant="destructive" className="w-full max-w-xs h-14 rounded-2xl font-bold gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
