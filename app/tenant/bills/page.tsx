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
import { Receipt, Search, Eye, Printer, MessageCircle, Download, X, Upload, FileDown, Trash2 } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"

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
  const { t, language } = useLanguage()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null)
  const [password, setPassword] = useState('')
  const [settings, setSettings] = useState<any>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [selectedBills, setSelectedBills] = useState<string[]>([])
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)

  const fetchBills = async (page = 1) => {
    try {
      const response = await fetch(`/api/pos/sales?page=${page}&limit=${itemsPerPage}&t=${Date.now()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
          setBills(result.data || [])
        } else {
          setBills(result.data || result || [])
        }
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
    fetchBills(1)
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchBills(currentPage)
  }, [currentPage])

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
    if (password !== correctPassword) {
      showToast.error('❌ Incorrect password!')
      return
    }
    
    try {
      const response = await fetch(`/api/pos/sales/${(billToDelete as any)._id || billToDelete.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setBills(prevBills => prevBills.filter(b => {
          const billId = (b as any)._id || b.id
          const deleteId = (billToDelete as any)._id || billToDelete.id
          return billId !== deleteId
        }))
        setIsPasswordModalOpen(false)
        setPassword('')
        setBillToDelete(null)
        showToast.success('✅ Bill deleted successfully!')
        fetchBills(currentPage)
      } else {
        showToast.error('❌ Failed to delete bill')
      }
    } catch (error) {
      showToast.error('❌ Error deleting bill')
    }
  }

  const handleBulkDelete = async () => {
    const correctPassword = settings.deletePassword || 'admin123'
    
    if (password !== correctPassword) {
      showToast.error('❌ Incorrect password!')
      return
    }

    try {
      let successCount = 0
      for (const billId of selectedBills) {
        const response = await fetch(`/api/pos/sales/${billId}`, { method: 'DELETE' })
        if (response.ok) successCount++
      }
      
      setIsPasswordModalOpen(false)
      setPassword('')
      setSelectedBills([])
      
      if (successCount > 0) {
        showToast.success(`✅ ${successCount} bills deleted successfully!`)
        fetchBills(currentPage)
      } else {
        showToast.error('❌ Failed to delete bills')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      showToast.error('❌ Error deleting bills')
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

  const exportBills = async () => {
    try {
      showToast.success('Fetching all bills...')
      const response = await fetch('/api/pos/sales?limit=999999')
      if (!response.ok) {
        showToast.error('Failed to fetch bills')
        return
      }
      const result = await response.json()
      const allBills = result.data || result || []

      const csvData = allBills.map((bill: Bill) => ({
        'Bill No': bill.billNo,
        'Store Name': bill.storeName,
        'Customer Name': bill.customerName,
        'Customer Phone': bill.customerPhone || '',
        'Date': new Date(bill.createdAt).toLocaleDateString('en-IN'),
        'Time': new Date(bill.createdAt).toLocaleTimeString('en-IN'),
        'Items': bill.items.map(item => `${item.name} (Qty: ${item.quantity}, Price: ${item.price}, Total: ${item.total})`).join(' | '),
        'Subtotal': bill.subtotal,
        'Discount': bill.discountAmount,
        'Tax': bill.tax,
        'Total': bill.total,
        'Payment Method': bill.paymentMethod,
        'Cashier': bill.cashier,
        'Store Address': bill.address,
        'Store Phone': bill.phone,
        'Store Email': bill.email,
        'GST': bill.gst,
        'Terms': bill.terms
      }))

      const headers = Object.keys(csvData[0] || {})
      const csv = [
        headers.join(','),
        ...csvData.map((row: any) => headers.map(header => {
          const value = row[header]
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bills-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast.success(`${allBills.length} bills exported successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      showToast.error('Failed to export bills')
    }
  }

  const importBills = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
          showToast.error('CSV file is empty')
          return
        }

        // Parse CSV properly handling quoted fields
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            const nextChar = line[i + 1]
            
            if (char === '"' && nextChar === '"') {
              current += '"'
              i++
            } else if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current)
              current = ''
            } else {
              current += char
            }
          }
          result.push(current)
          return result
        }

        const headers = parseCSVLine(lines[0])
        const importedBills = []

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          if (values.length < headers.length) continue

          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })

          // Skip if Bill No is empty or invalid
          if (!row['Bill No'] || row['Bill No'].trim() === '') continue

          const items = row['Items'] ? row['Items'].split(' | ').map((itemStr: string) => {
            const match = itemStr.match(/(.+?)\s*\(Qty:\s*(\d+),\s*Price:\s*([\d.]+),\s*Total:\s*([\d.]+)\)/)
            if (match) {
              return {
                name: match[1].trim(),
                quantity: parseInt(match[2]),
                price: parseFloat(match[3]),
                total: parseFloat(match[4])
              }
            }
            return null
          }).filter(Boolean) : []

          importedBills.push({
            billNo: row['Bill No'],
            storeName: row['Store Name'] || 'Store',
            customerName: row['Customer Name'] || 'Walk-in Customer',
            customerPhone: row['Customer Phone'] || null,
            items: items,
            subtotal: parseFloat(row['Subtotal']) || 0,
            discount: 0,
            discountAmount: parseFloat(row['Discount']) || 0,
            tax: parseFloat(row['Tax']) || 0,
            total: parseFloat(row['Total']) || 0,
            paymentMethod: row['Payment Method'] || 'cash',
            cashier: row['Cashier'] || 'Admin',
            address: row['Store Address'] || '',
            phone: row['Store Phone'] || '',
            email: row['Store Email'] || '',
            gst: row['GST'] || '',
            terms: row['Terms'] || ''
          })
        }

        if (importedBills.length === 0) {
          showToast.error('No valid bills found in CSV')
          return
        }

        const response = await fetch('/api/pos/sales/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bills: importedBills })
        })

        if (response.ok) {
          showToast.success(`${importedBills.length} bills imported successfully!`)
          fetchBills(currentPage)
        } else {
          const error = await response.json()
          showToast.error(error.error || 'Failed to import bills')
        }
      } catch (error) {
        console.error('Import error:', error)
        showToast.error('Error importing bills')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
      <MainLayout title={t('billHistory')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('billHistory')}>
      <FeatureGuard feature="bills">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>{t('allBills')} ({bills.length})</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {selectedBills.length > 0 && (
                  <Button 
                    onClick={() => {
                      setBillToDelete(null)
                      setIsPasswordModalOpen(true)
                    }} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedBills.length})
                  </Button>
                )}
                <Button 
                  onClick={() => setIsClearAllModalOpen(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button onClick={exportBills} variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => document.getElementById('import-bills')?.click()} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <input
                  id="import-bills"
                  type="file"
                  accept=".csv"
                  onChange={importBills}
                  className="hidden"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('searchBillsPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBills(filteredBills.map(b => (b as any)._id || b.id))
                        } else {
                          setSelectedBills([])
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="text-center w-16">Sr. No.</TableHead>
                  <TableHead className="text-center">{t('billNo')}</TableHead>
                  <TableHead className="text-center">{t('customer')}</TableHead>
                  <TableHead className="text-center">{t('items')}</TableHead>
                  <TableHead className="text-center">{t('total')}</TableHead>
                  <TableHead className="text-center">{t('payment')}</TableHead>
                  <TableHead className="text-center">{t('date')}</TableHead>
                  <TableHead className="text-center">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill, index) => {
                  const billId = (bill as any)._id || bill.id
                  return (
                  <TableRow key={bill.id}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedBills.includes(billId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBills([...selectedBills, billId])
                          } else {
                            setSelectedBills(selectedBills.filter(id => id !== billId))
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-center">{bill.billNo}</TableCell>
                    <TableCell className="text-center">
                      <div>
                        <div>{bill.customerName}</div>
                        {bill.customerPhone && (
                          <div className="text-sm text-muted-foreground">{bill.customerPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{bill.items.length} {t('items')}</TableCell>
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
                  )
                })}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} bills
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear All Confirmation Modal */}
        <Dialog open={isClearAllModalOpen} onOpenChange={setIsClearAllModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Clear All Bills</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter password to delete <strong>ALL bills</strong>. This action cannot be undone!
              </p>
              <div className="space-y-2">
                <Label htmlFor="clearAllPassword">{t('password')}</Label>
                <Input
                  id="clearAllPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsClearAllModalOpen(false)
                    setPassword('')
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={async () => {
                    const correctPassword = settings.deletePassword || 'admin123'
                    if (password !== correctPassword) {
                      showToast.error('❌ Incorrect password!')
                      return
                    }
                    try {
                      const response = await fetch('/api/pos/sales/clear', { method: 'DELETE' })
                      if (response.ok) {
                        setIsClearAllModalOpen(false)
                        setPassword('')
                        showToast.success('✅ All bills deleted successfully!')
                        fetchBills(1)
                        setSelectedBills([])
                      } else {
                        showToast.error('❌ Failed to clear bills')
                      }
                    } catch (error) {
                      showToast.error('❌ Error clearing bills')
                    }
                  }}
                >
                  Delete All
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Modal */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <span>{t('deleteBill')}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {billToDelete ? (
                  <>{t('enterPasswordToDelete')} <strong>{billToDelete.billNo}</strong></>
                ) : (
                  <>Enter password to delete <strong>{selectedBills.length} bills</strong></>
                )}
              </p>
              <div className="space-y-2">
                <Label htmlFor="deletePassword">{t('password')}</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword')}
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
                    setSelectedBills([])
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    if (billToDelete) {
                      handleDeleteBill()
                    } else if (selectedBills.length > 0) {
                      handleBulkDelete()
                    }
                  }}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Bill Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('billDetails')} - {selectedBill?.billNo}</DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="py-4">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">{selectedBill.storeName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBill.address}</p>
                  <p className="text-sm">{t('phone')}: {selectedBill.phone}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>{t('billNo')}:</span>
                    <span className="font-medium">{selectedBill.billNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('customer')}:</span>
                    <span>{selectedBill.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('date')}:</span>
                    <span>{new Date(selectedBill.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">{t('items')}:</h4>
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹ {(item.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}:</span>
                    <span>₹ {(selectedBill.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('discount')}:</span>
                    <span>₹ {(selectedBill.discountAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('tax')}:</span>
                    <span>₹ {(selectedBill.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('total')}:</span>
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
                    {t('downloadPDF')}
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