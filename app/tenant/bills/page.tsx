"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Receipt, Search, Eye, Printer, MessageCircle } from "lucide-react"

interface Bill {
  id: string
  billNo: string
  customerName: string
  customerPhone?: string
  items: any[]
  subtotal: number
  discount: number
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
  const [settings, setSettings] = useState<any>({})

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/pos/sales')
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
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const viewBill = (bill: Bill) => {
    setSelectedBill(bill)
    setIsViewModalOpen(true)
  }

  const sendBillViaWhatsApp = (bill: Bill) => {
    if (!bill.customerPhone) {
      alert('Customer phone number required')
      return
    }

    const storeName = settings.storeName || bill.storeName || 'Store'
    const storeAddress = settings.address || bill.address || 'Store Address'
    const storePhone = settings.phone || bill.phone || '9427300816'

    // Create PDF download link
    const pdfLink = `${window.location.origin}/api/bill-pdf?id=${(bill as any)._id || bill.id}`

    const billMessage = `🧾 *${storeName.toUpperCase()}*

📋 Bill No: ${bill.billNo}
👤 Customer: ${bill.customerName}
📅 Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}

*ITEMS:*
${bill.items.map(item => `• ${item.name} x${item.quantity} = ₹${(item.total || 0).toFixed(2)}`).join('\n')}

💰 *TOTAL AMOUNT: ₹${(bill.total || 0).toFixed(2)}*
💳 Payment: ${bill.paymentMethod}

📎 *Download Bill PDF:*
${pdfLink}

Thank you for your business! 🙏

📍 ${storeAddress}
📞 Contact: ${storePhone}`
    
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
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
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
                        {bill.customerPhone && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => sendBillViaWhatsApp(bill)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                    <span>Tax:</span>
                    <span>₹ {(selectedBill.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹ {(selectedBill.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}