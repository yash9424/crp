"use client"

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeDisplayProps {
  value: string
  width?: number
  height?: number
  fontSize?: number
  displayValue?: boolean
  format?: 'CODE128' | 'EAN13' | 'CODE39'
}

export function BarcodeDisplay({ 
  value, 
  width = 2, 
  height = 50, 
  fontSize = 12, 
  displayValue = true,
  format = 'CODE128'
}: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          textAlign: 'center',
          textPosition: 'bottom',
          background: '#ffffff',
          lineColor: '#000000'
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
      }
    }
  }, [value, width, height, fontSize, displayValue, format])

  if (!value) {
    return <div className="text-sm text-gray-500">No barcode</div>
  }

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
    </div>
  )
}

export function PrintableBarcode({ value, label }: { value: string; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          textAlign: 'center',
          textPosition: 'bottom',
          background: '#ffffff',
          lineColor: '#000000'
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
      }
    }
  }, [value])

  return (
    <div className="text-center p-2 border border-gray-300 bg-white" style={{ width: '200px' }}>
      {label && <div className="text-xs font-medium mb-1">{label}</div>}
      <canvas ref={canvasRef} />
    </div>
  )
}