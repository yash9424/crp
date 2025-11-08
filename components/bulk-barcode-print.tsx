"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, Package } from 'lucide-react'
import { BarcodeDisplay } from './barcode-display'
import { showToast } from '@/lib/toast'

interface BulkBarcodePrintProps {
  products: any[]
}

export function BulkBarcodePrint({ products }: BulkBarcodePrintProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [copies, setCopies] = useState<{ [key: string]: number }>({})

  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
      setCopies({ ...copies, [productId]: 1 })
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
      const newCopies = { ...copies }
      delete newCopies[productId]
      setCopies(newCopies)
    }
  }

  const handleCopiesChange = (productId: string, count: number) => {
    setCopies({ ...copies, [productId]: Math.max(1, count) })
  }

  const printBarcodes = () => {
    if (selectedProducts.length === 0) {
      showToast.error('Please select at least one product')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))
    
    let printContent = `
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 10px; }
            .barcode-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 10px; 
              margin: 10px 0;
            }
            .barcode-label { 
              border: 1px solid #ccc; 
              padding: 9px; 
              text-align: center; 
              page-break-inside: avoid;
              width: 200px;
              height: 120px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .product-name { font-weight: bold; font-size: 12px; margin-bottom: 5px; }
            .product-price { font-size: 11px; margin-bottom: 8px; }
            .barcode-container { flex: 1; display: flex; align-items: center; justify-content: center; }
            canvas { display: block; margin: 0 auto; }
            @media print { 
              body { margin: 0; padding: 5px; }
              .barcode-grid { gap: 5px; }
              @page { size: A4; margin: 10mm; }
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <h2 style="text-align: center; margin-bottom: 20px;">Barcode Labels</h2>
          <div class="barcode-grid">
    `

    selectedProductsData.forEach(product => {
      const copyCount = copies[product.id] || 1
      for (let i = 0; i < copyCount; i++) {
        printContent += `
          <div class="barcode-label">
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.price}</div>
            <div class="barcode-container">
              <canvas id="barcode-${product.id}-${i}"></canvas>
            </div>
          </div>
        `
      }
    })

    printContent += `
          </div>
          <script>
            window.onload = function() {
    `

    selectedProductsData.forEach(product => {
      const copyCount = copies[product.id] || 1
      for (let i = 0; i < copyCount; i++) {
        printContent += `
          try {
            JsBarcode("#barcode-${product.id}-${i}", "${product.barcode}", {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 12,
              textAlign: "center",
              textPosition: "bottom",
              textMargin: 2
            });
          } catch(e) { console.error('Barcode error:', e); }
        `
      }
    })

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
  }

  const productsWithBarcodes = products.filter(p => p.barcode)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Barcodes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Bulk Barcode Printing
          </DialogTitle>
        </DialogHeader>
        
        {productsWithBarcodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No products with barcodes found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 flex justify-between items-center py-3 bg-gray-100 px-4 rounded">
              <div className="text-sm font-medium text-gray-700">
                {selectedProducts.length} of {productsWithBarcodes.length} products selected
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProducts(productsWithBarcodes.map(p => p.id))
                    const newCopies: { [key: string]: number } = {}
                    productsWithBarcodes.forEach(p => newCopies[p.id] = 1)
                    setCopies(newCopies)
                  }}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProducts([])
                    setCopies({})
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
              {productsWithBarcodes.map(product => (
                <div key={product.id} className={`flex items-center gap-3 p-3 border rounded transition-colors ${
                  selectedProducts.includes(product.id) ? 'bg-gray-100 border-gray-400' : 'hover:bg-gray-50'
                }`}>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="font-mono text-xs">{product.barcode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Label className="text-sm text-gray-600">Qty:</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={copies[product.id] || 1}
                      onChange={(e) => handleCopiesChange(product.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-center"
                      disabled={!selectedProducts.includes(product.id)}
                    />
                  </div>


                </div>
              ))}
            </div>

            <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Total labels: {Object.values(copies).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={printBarcodes} 
                  disabled={selectedProducts.length === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Labels
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}