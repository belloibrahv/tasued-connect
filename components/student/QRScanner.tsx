"use client"

import { useEffect, useState, useCallback } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: any) => void
}

export function QRScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [scannerKey, setScannerKey] = useState(0) // Key for forcing remount

  // Initialize scanner
  const initializeScanner = useCallback(() => {
    setIsInitializing(true)
    
    // Small delay to ensure DOM element exists
    const timeoutId = setTimeout(() => {
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
          // Success callback - clear scanner first
          html5QrcodeScanner.clear().then(() => {
            setIsScanning(false)
            onScanSuccess(decodedText)
          }).catch(console.error)
        },
        (errorMessage) => {
          // Failure callback (called frequently during scanning)
          if (onScanFailure) onScanFailure(errorMessage)
        }
      )

      setIsInitializing(false)

      // Cleanup function
      return () => {
        html5QrcodeScanner.clear().catch(console.error)
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [onScanSuccess, onScanFailure])

  // Initialize on mount and when scannerKey changes
  useEffect(() => {
    const cleanup = initializeScanner()
    return cleanup
  }, [scannerKey, initializeScanner])

  // Handle reset - reinitialize without page reload
  const handleReset = useCallback(() => {
    setIsScanning(true)
    setIsInitializing(true)
    // Increment key to force remount of scanner element
    setScannerKey(prev => prev + 1)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Scanner container with key for forced remount */}
      <div 
        key={scannerKey}
        id="reader" 
        className="w-full overflow-hidden rounded-lg border-2 border-primary/20 bg-gray-50"
      />

      {isInitializing && (
        <div className="mt-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Initializing camera...</p>
        </div>
      )}

      {!isScanning && !isInitializing && (
        <div className="mt-4 text-center">
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Again
          </Button>
        </div>
      )}

      {isScanning && !isInitializing && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Position the QR code within the frame to scan.
        </p>
      )}
    </div>
  )
}
