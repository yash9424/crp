"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Receipt, Search, Eye, Printer, MessageCircle, Download, X } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"

interface Bill {
  id: string
  billNo: string
  customerName: string
  customerPhone?: string
  items: any[]
  subtotal: number
  discount: number
  discountAmount: number
  tax: number
  total: number
  paymentMethod: string
  cashier: string
  storeName: string
  address: string
  phone: string
  email: string
  gst: string
  terms: string
  createdAt: string
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null)
  const [password, setPassword] = useState('')
  const [settings, setSettings] = useState<any>({})

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/pos/sales?t=' + Date.now())
      if (response.ok) {
        const data = await response.json()
        setBills(data)
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  useEffect(() => {
    fetchBills()
    fetchSettings()
  }, [])

  const filteredBills = bills.filter(bill =>
    bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.customerPhone && bill.customerPhone.includes(searchTerm))
  )

  const viewBill = (bill: Bill) => {
    setSelectedBill(bill)
    setIsViewModalOpen(true)
  }

  const handleDeleteBill = async () => {
    if (!billToDelete) return
    
    const correctPassword = settings.deletePassword || 'admin123'
    console.log('Entered password:', password)
    console.log('Correct password:', correctPassword)
    if (password !== correctPassword) {
      showToast.error('❌ Incorrect password!')
      return
    }
    
    try {
      const response = await fetch(`/api/pos/sales/${(billToDelete as any)._id || billToDelete.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        // Remove bill from local state immediately
        setBills(prevBills => {
          const newBills = prevBills.filter(b => {
            const billId = (b as any)._id || b.id
            const deleteId = (billToDelete as any)._id || billToDelete.id
            return billId !== deleteId
          })
          return newBills
        })
        setIsPasswordModalOpen(false)
        setPassword('')
        setBillToDelete(null)
        // Show success message in a better way
        const successDiv = document.createElement('div')
        successDiv.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-family: system-ui; font-weight: 500;">
            ✅ Bill deleted successfully!
          </div>
        `
        document.body.appendChild(successDiv)
        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 3000)
        // Refresh data in background
        fetchBills()
      } else {
        showToast.error('❌ Failed to delete bill. Please try again.')
      }
    } catch (error) {
      showToast.error('❌ Error deleting bill. Please check your connection.')
    }
  }

  const sendBillViaWhatsApp = (bill: Bill) => {
    if (!bill.customerPhone) {
      showToast.error('Customer phone number required')
      return
    }

    const addedText = settings.whatsappText || ''
    
    const storeName = settings.storeName || bill.storeName || 'Store'
    const storeAddress = settings.address || bill.address || 'Store Address'
    const storePhone = settings.phone || bill.phone || '9427300816'

    // Create receipt link based on settings
    const billFormat = settings.billFormat || 'professional'
    const receiptLink = billFormat === 'simple' 
      ? `${window.location.origin}/api/receipt-simple/${(bill as any)._id || bill.id}`
      : `${window.location.origin}/api/receipt/${(bill as any)._id || bill.id}`

    const billMessage = `*${storeName.toUpperCase()}*

*Bill No:* ${bill.billNo}
*Customer:* ${bill.customerName}
*Date:* ${new Date(bill.createdAt).toLocaleDateString('en-IN')}
*Time:* ${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

*ITEMS PURCHASED:*
${bill.items.map(item => `• ${item.name} x${item.quantity} = Rs${(item.total || 0).toFixed(2)}`).join('\n')}

*Subtotal:* Rs${(bill.subtotal || 0).toFixed(2)}
*Discount:* Rs${(bill.discount || 0).toFixed(2)}
*Tax:* Rs${(bill.tax || 0).toFixed(2)}
*TOTAL AMOUNT: Rs${(bill.total || 0).toFixed(2)}*
*Payment Method:* ${bill.paymentMethod}

*View Your Receipt:*
${receiptLink}

thanks for shopping

come again

${storeAddress}
Contact: ${storePhone}`
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${bill.customerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(billMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  const generateBillPDF = (bill: Bill) => {
    const storeName = settings.storeName || bill.storeName || 'Store'
    const storeAddress = settings.address || bill.address || 'Store Address'
    const storePhone = settings.phone || bill.phone || '9427300816'
    
    // Create a canvas to generate PDF content
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      canvas.width = 400
      canvas.height = 600
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add content to canvas
      ctx.fillStyle = 'black'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(storeName.toUpperCase(), 200, 30)
      
      ctx.font = '12px Arial'
      ctx.fillText(storeAddress, 200, 50)
      ctx.fillText(`Phone: ${storePhone}`, 200, 70)
      
      // Bill details
      ctx.textAlign = 'left'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`Bill No: ${bill.billNo}`, 20, 110)
      ctx.fillText(`Customer: ${bill.customerName}`, 20, 130)
      ctx.fillText(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, 20, 150)
      
      // Items
      let yPos = 180
      ctx.fillText('ITEMS:', 20, yPos)
      yPos += 20
      
      bill.items.forEach(item => {
        ctx.font = '12px Arial'
        ctx.fillText(`${item.name} x${item.quantity} = ₹${(item.total || 0).toFixed(2)}`, 20, yPos)
        yPos += 20
      })
      
      // Total
      yPos += 20
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`TOTAL AMOUNT: ₹${(bill.total || 0).toFixed(2)}`, 20, yPos)
      yPos += 20
      ctx.font = '12px Arial'
      ctx.fillText(`Payment: ${bill.paymentMethod}`, 20, yPos)
      
      // Footer
      yPos += 40
      ctx.textAlign = 'center'
      ctx.fillText('Thank you for your business!', 200, yPos)
      ctx.fillText(`Contact: ${storePhone}`, 200, yPos + 20)
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Bill-${bill.billNo}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  if (loading) {
    return (
      <MainLayout title="Bill History" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading bills...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Bill History" userRole="tenant-admin">
      <FeatureGuard feature="bills">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>All Bills ({bills.length})</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by bill no, customer, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  autoComplete="off"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Bill No</TableHead>
                  <TableHead className="text-center">Customer</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium text-center">{bill.billNo}</TableCell>
                    <TableCell className="text-center">
                      <div>
                        <div>{bill.customerName}</div>
                        {bill.customerPhone && (
                          <div className="text-sm text-muted-foreground">{bill.customerPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{bill.items.length} items</TableCell>
                    <TableCell className="text-center">₹  {(bill.total || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{bill.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => viewBill(bill)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            // Generate PDF directly in browser
                            const itemsText = bill.items.map((item: any) => 
                              `${item.name} x${item.quantity} @ Rs${(item.price || 0).toFixed(2)} = Rs${(item.total || 0).toFixed(2)}`
                            ).join('\n')
                            
                            const doc = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 18 Tf
200 750 Td
(${(bill.storeName || 'STORE').toUpperCase()}) Tj
/F1 10 Tf
-150 -25 Td
(${bill.address || 'Store Address'}) Tj
50 -15 Td
(Phone: ${bill.phone || '9427300816'}) Tj
-50 -35 Td
(================================================) Tj
/F1 12 Tf
0 -25 Td
(Bill No: ${bill.billNo}) Tj
250 0 Td
(Date: ${new Date(bill.createdAt).toLocaleDateString()}) Tj
-250 -25 Td
(Customer: ${bill.customerName}) Tj
${bill.customerPhone ? `0 -20 Td\n(Phone: ${bill.customerPhone}) Tj` : ''}
0 -35 Td
(================================================) Tj
/F1 14 Tf
0 -30 Td
(ITEMS) Tj
/F1 10 Tf
0 -25 Td
(Item Name                    Qty    Rate    Amount) Tj
0 -15 Td
(------------------------------------------------) Tj
${bill.items.map((item: any) => `0 -20 Td\n(${item.name.padEnd(25)} ${String(item.quantity).padStart(3)}  ${('Rs' + ' ' + (item.price || 0).toFixed(2)).padStart(8)}  ${('Rs' + ' ' + (item.total || 0).toFixed(2)).padStart(8)}) Tj`).join('\n')}
0 -25 Td
(------------------------------------------------) Tj
/F1 12 Tf
300 -25 Td
(Subtotal: Rs  ${(bill.subtotal || 0).toFixed(2)}) Tj
0 -20 Td
(Tax: Rs ${(bill.tax || 0).toFixed(2)}) Tj
0 -5 Td
(------------------------) Tj
/F1 16 Tf
0 -25 Td
(TOTAL: Rs  ${(bill.total || 0).toFixed(2)}) Tj
/F1 10 Tf
-300 -30 Td
(Payment Method: ${bill.paymentMethod}) Tj
0 -40 Td
(================================================) Tj
100 -25 Td
(Thank you for your business!) Tj
-50 -15 Td
(Visit us again!) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000565 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`
                            
                            const blob = new Blob([doc], { type: 'application/pdf' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `Bill-${bill.billNo}.pdf`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {bill.customerPhone && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => sendBillViaWhatsApp(bill)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setBillToDelete(bill)
                            setIsPasswordModalOpen(true)
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Password Modal */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <span>Delete Bill</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter admin password to delete bill: <strong>{billToDelete?.billNo}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  autoFocus={false}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteBill()
                    }
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsPasswordModalOpen(false)
                    setPassword('')
                    setBillToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDeleteBill}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Bill Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bill Details - {selectedBill?.billNo}</DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="py-4">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">{selectedBill.storeName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBill.address}</p>
                  <p className="text-sm">Phone: {selectedBill.phone}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Bill No:</span>
                    <span className="font-medium">{selectedBill.billNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{selectedBill.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(selectedBill.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Items:</h4>
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹ {(item.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹ {(selectedBill.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>₹ {(selectedBill.discountAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹ {(selectedBill.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹ {(selectedBill.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => {
                      // Generate PDF directly in browser
                      const doc = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 18 Tf
200 750 Td
(${(selectedBill.storeName || 'STORE').toUpperCase()}) Tj
/F1 10 Tf
-150 -25 Td
(${selectedBill.address || 'Store Address'}) Tj
50 -15 Td
(Phone: ${selectedBill.phone || '9427300816'}) Tj
-50 -35 Td
(================================================) Tj
/F1 12 Tf
0 -25 Td
(Bill No: ${selectedBill.billNo}) Tj
250 0 Td
(Date: ${new Date(selectedBill.createdAt).toLocaleDateString()}) Tj
-250 -25 Td
(Customer: ${selectedBill.customerName}) Tj
${selectedBill.customerPhone ? `0 -20 Td\n(Phone: ${selectedBill.customerPhone}) Tj` : ''}
0 -35 Td
(================================================) Tj
/F1 14 Tf
0 -30 Td
(ITEMS) Tj
/F1 10 Tf
0 -25 Td
(Item Name                    Qty    Rate    Amount) Tj
0 -15 Td
(------------------------------------------------) Tj
${selectedBill.items.map((item: any) => `0 -20 Td\n(${item.name.padEnd(25)} ${String(item.quantity).padStart(3)}  ${('Rs' + ' ' + (item.price || 0).toFixed(2)).padStart(8)}  ${('Rs' + ' ' + (item.total || 0).toFixed(2)).padStart(8)}) Tj`).join('\n')}
0 -25 Td
(------------------------------------------------) Tj
/F1 12 Tf
300 -25 Td
(Subtotal: Rs${(selectedBill.subtotal || 0).toFixed(2)}) Tj
0 -20 Td
(Tax: Rs${(selectedBill.tax || 0).toFixed(2)}) Tj
0 -5 Td
(------------------------) Tj
/F1 16 Tf
0 -25 Td
(TOTAL: Rs${(selectedBill.total || 0).toFixed(2)}) Tj
/F1 10 Tf
-300 -30 Td
(Payment Method: ${selectedBill.paymentMethod}) Tj
0 -40 Td
(================================================) Tj
100 -25 Td
(Thank you for your business!) Tj
-50 -15 Td
(Visit us again!) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000565 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`
                      
                      const blob = new Blob([doc], { type: 'application/pdf' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `Bill-${selectedBill.billNo}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}