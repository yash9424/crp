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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Barcode Printing</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {productsWithBarcodes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No products with barcodes found</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Select products to print barcodes ({selectedProducts.length} selected)
                </p>
                <div className="space-x-2">
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
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {productsWithBarcodes.map(product => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 border rounded">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                    />
                    
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.category} • ₹{product.price} • {product.barcode}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`copies-${product.id}`} className="text-sm">Copies:</Label>
                      <Input
                        id={`copies-${product.id}`}
                        type="number"
                        min="1"
                        max="50"
                        value={copies[product.id] || 1}
                        onChange={(e) => handleCopiesChange(product.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8"
                        disabled={!selectedProducts.includes(product.id)}
                      />
                    </div>

                    <div className="w-24">
                      <BarcodeDisplay value={product.barcode} height={20} fontSize={6} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={printBarcodes} disabled={selectedProducts.length === 0}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Selected ({selectedProducts.length})
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}