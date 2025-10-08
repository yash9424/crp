"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, Package } from 'lucide-react'
import { showToast } from '@/lib/toast'

interface QuantityBarcodePrintProps {
  product: any
}

export function QuantityBarcodePrint({ product }: QuantityBarcodePrintProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [printQuantity, setPrintQuantity] = useState('')

  const printQuantityBarcodes = () => {
    const qty = parseInt(printQuantity) || 1
    if (!product.barcode) {
      showToast.error('Product has no barcode')
      return
    }
    if (qty < 1) {
      showToast.error('Please enter a valid quantity')
      return
    }
    if (qty > product.stock) {
      showToast.error(`Cannot print ${qty} barcodes. Only ${product.stock} items in stock.`)
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    let printContent = `
      <html>
        <head>
          <title>Quantity Barcodes - ${product.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 5mm; }
            .barcode-grid { 
              display: flex;
              flex-direction: column;
              gap: 3mm; 
              margin: 0;
              align-items: center;
            }
            .barcode-label { 
              border: 1px dashed #999; 
              padding: 3mm; 
              text-align: center; 
              page-break-inside: avoid;
              width: 80mm;
              height: 30mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
              background: white;
              margin: 0 auto;
            }
            .barcode-label::before {
              content: '✂';
              position: absolute;
              top: -3px;
              left: -3px;
              font-size: 8px;
              color: #ccc;
            }
            .product-name { font-weight: bold; font-size: 8px; margin-bottom: 1mm; line-height: 1; }
            .product-price { font-size: 7px; margin-bottom: 1mm; color: #333; }
            canvas { display: block; margin: 0 auto; }
            @media print { 
              body { margin: 0; padding: 3mm; }
              .barcode-grid { gap: 1mm; }
              @page { size: A4; margin: 5mm; }
              .barcode-label::before { display: none; }
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 5mm; padding: 2mm; border-bottom: 2px solid #000;">
            <h3 style="margin: 0; font-size: 12px;">${product.name}</h3>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #666;">${qty} identical barcodes | Single column layout | Cut along dashed lines</p>
          </div>
          <div class="barcode-grid">
    `

    // Generate same barcode multiple times
    for (let i = 1; i <= qty; i++) {
      // Add page break after every 15 items (single column)
      if (i > 1 && (i - 1) % 15 === 0) {
        printContent += `</div><div style="page-break-before: always;"></div><div class="barcode-grid">`
      }
      
      printContent += `
        <div class="barcode-label">
          <div class="product-name">${product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name}</div>
          <div class="product-price">₹${product.price}</div>
          <canvas id="barcode-${i}"></canvas>
        </div>
      `
    }

    printContent += `
          </div>
          <script>
            window.onload = function() {
    `

    // Generate same barcode for all labels
    for (let i = 1; i <= qty; i++) {
      printContent += `
        try {
          JsBarcode("#barcode-${i}", "${product.barcode}", {
            format: "CODE128",
            width: 1.5,
            height: 25,
            displayValue: true,
            fontSize: 8,
            textAlign: "center",
            textPosition: "bottom",
            textMargin: 1
          });
        } catch(e) { console.error('Barcode error:', e); }
      `
    }

    printContent += `
              setTimeout(() => {
                window.print();
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gray text-black border-0 shadow-none hover:bg-gray-50">
          <Printer className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Quantity Barcodes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <strong>Product:</strong> {product.name}<br/>
            <strong>Stock:</strong> {product.stock} items<br/>
            <strong>Base Barcode:</strong> {product.barcode}
          </div>

          <div className="space-y-2">
            <Label htmlFor="printQty">Number of barcodes to print</Label>
            <Input
              id="printQty"
              type="number"
              min="1"
              max={product.stock || 100}
              value={printQuantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || ''
                if (value === '' || (value >= 1 && value <= product.stock)) {
                  setPrintQuantity(e.target.value)
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder={`Max: ${product.stock}`}
            />
            <div className="text-xs text-gray-500">
              • All barcodes will be identical: {product.barcode}<br/>
              • Maximum quantity: {product.stock} (current stock)<br/>
              • Labels are sized for easy cutting (80mm x 30mm)
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={printQuantityBarcodes}>
              <Printer className="w-4 h-4 mr-2" />
              Print {printQuantity || 1} Barcodes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}