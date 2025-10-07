"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Scan, X } from 'lucide-react'
import { showToast } from '@/lib/toast'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isOpen: boolean
  onClose: () => void
}

export function BarcodeScanner({ onScan, isOpen, onClose }: BarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Start camera for scanning
  const startCamera = async () => {
    try {
      setIsScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error('Camera access error:', error)
      showToast.error('Camera access denied. Please use manual entry.')
      setIsScanning(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Handle manual barcode entry
  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim())
      setManualBarcode('')
      onClose()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Stop camera when dialog closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setManualBarcode('')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Scan className="w-5 h-5" />
            <span>Barcode Scanner</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Manual Entry */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual Entry</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter or scan barcode"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualScan()
                  }
                }}
                autoFocus
              />
              <Button onClick={handleManualScan} disabled={!manualBarcode.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Camera Scanner */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Camera Scanner</label>
            
            {!isScanning ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={startCamera}
              >
                <Scan className="w-4 h-4 mr-2" />
                Start Camera Scanner
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 bg-black rounded border"
                  />
                  <div className="absolute inset-0 border-2 border-red-500 rounded pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-red-500"></div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={stopCamera}
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Type or paste barcode in manual entry field</p>
            <p>• Use camera scanner to scan physical barcodes</p>
            <p>• Point camera at barcode and align with red line</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}