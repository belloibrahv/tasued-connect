"use client"

import { useEffect, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: any) => void
}

export function QRScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    )

    html5QrcodeScanner.render(
      (decodedText) => {
        // Success callback
        html5QrcodeScanner.clear()
        setIsScanning(false)
        onScanSuccess(decodedText)
      },
      (errorMessage) => {
        // Failure callback
        if (onScanFailure) onScanFailure(errorMessage)
      }
    )

    setScanner(html5QrcodeScanner)

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error)
      }
    }
  }, [onScanSuccess, onScanFailure])

  const handleReset = () => {
    window.location.reload() // Simplest way to reset scanner for now
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div id="reader" className="w-full overflow-hidden rounded-lg border-2 border-primary/20 bg-gray-50"></div>

      {!isScanning && (
        <div className="mt-4 text-center">
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Again
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground mt-4">
        Position the QR code within the frame to scan.
      </p>
    </div>
  )
}
