"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Scan, Keyboard } from 'lucide-react'
import { showToast } from '@/lib/toast'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isOpen: boolean
  onClose: () => void
}

export function BarcodeScanner({ onScan, isOpen, onClose }: BarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)



  // Handle manual barcode entry
  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim())
      setManualBarcode('')
      onClose()
    }
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    if (!isOpen) {
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
          {/* Barcode Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Keyboard className="w-4 h-4" />
              <span>Barcode Scanner Input</span>
            </label>
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                placeholder="Scan or type barcode here"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualScan()
                  }
                }}
                className="font-mono text-lg"
                autoFocus
              />
              <Button onClick={handleManualScan} disabled={!manualBarcode.trim()}>
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-2 p-3 bg-gray-50 rounded">
            <div>
              <p className="font-semibold text-gray-700 mb-1">🔍 How to use your barcode scanner:</p>
              <p>• Click in the input field above</p>
              <p>• Scan any product barcode with your scanner device</p>
              <p>• Barcode will appear automatically</p>
              <p>• Press Enter or click "Add to Cart" to add the product</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">⌨️ Manual entry:</p>
              <p>• Type the barcode numbers manually if needed</p>
              <p>• Works with any barcode format (EAN, UPC, Code 128, etc.)</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}