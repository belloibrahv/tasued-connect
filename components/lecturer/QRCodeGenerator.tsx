"use client"

import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Maximize2 } from "lucide-react"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  label?: string
}

export function QRCodeGenerator({ value, size = 300, label }: QRCodeGeneratorProps) {
  const downloadQR = () => {
    const canvas = document.getElementById("qr-code-svg") as HTMLCanvasElement
    if (!canvas) return

    // Logic to download would go here, but SVG is tricky to direct download without conversion
    // For now we'll just alert
    alert("Download functionality would be implemented here")
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-8 bg-white border-2 border-primary/10 shadow-lg">
        <div className="bg-white p-4 rounded-xl">
          <QRCodeSVG
            width={size}
            height={size}
            value={value}
            level="H"
            includeMargin={true}
            id="qr-code-svg"
            imageSettings={{
              src: "https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3.png",
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>
        {label && (
          <p className="text-center font-bold text-2xl mt-4 tracking-wider">{label}</p>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadQR}>
          <Download className="mr-2 h-4 w-4" />
          Save QR
        </Button>
        <Button variant="outline">
          <Maximize2 className="mr-2 h-4 w-4" />
          Fullscreen
        </Button>
      </div>

      <p className="text-sm text-muted-foreground max-w-xs text-center">
        This code refreshes every 15 seconds for security.
      </p>
    </div>
  )
}
