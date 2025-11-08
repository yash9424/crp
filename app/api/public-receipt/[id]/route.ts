import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const billId = params.id
    
    if (!billId) {
      return new NextResponse('Bill ID required', { status: 400 })
    }

    const db = await connectDB()
    
    // Search across all tenant sales collections to find the bill
    const collections = await db.listCollections({ name: /^sales_/ }).toArray()
    let bill = null
    let tenantId = null
    
    for (const collection of collections) {
      const salesCollection = db.collection(collection.name)
      const foundBill = await salesCollection.findOne({ _id: new ObjectId(billId) })
      if (foundBill) {
        bill = foundBill
        tenantId = collection.name.replace('sales_', '')
        break
      }
    }
    
    if (!bill) {
      return new NextResponse('Bill not found', { status: 404 })
    }

    // Fetch store settings for this tenant
    const settingsCollection = db.collection(`settings_${tenantId}`)
    const settings = await settingsCollection.findOne({}) || {}

    // Generate receipt HTML
    const storeName = (settings as any).storeName || bill.storeName || 'Fashion Store'
    const storeAddress = (settings as any).address || bill.address || 'Store Address'
    const storePhone = (settings as any).phone || bill.phone || '9427300816'
    const storeGST = (settings as any).gst || bill.gst || 'GST1234567890'
    
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${bill.billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      background: white; 
      padding: 20px;
      color: #000;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 3px solid #000;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 2px solid #000;
    }
    .store-info {
      flex: 1;
    }
    .store-name {
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .store-details {
      font-size: 12px;
      line-height: 1.4;
    }
    .customer-info {
      display: flex;
      padding: 10px 20px;
      border-bottom: 1px solid #000;
    }
    .customer-left, .invoice-right {
      flex: 1;
    }
    .customer-left {
      border-right: 1px solid #000;
      padding-right: 15px;
    }
    .invoice-right {
      padding-left: 15px;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
      font-size: 13px;
    }
    .info-label {
      font-weight: bold;
      width: 80px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th, .items-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .items-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .totals-section {
      display: flex;
      border-top: 2px solid #000;
    }
    .amount-words {
      flex: 2;
      padding: 15px;
      border-right: 1px solid #000;
    }
    .amount-numbers {
      flex: 1;
      padding: 15px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .total-row.final {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
      padding: 15px;
      border-top: 2px solid #000;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="store-info">
        <div class="store-name">${storeName}</div>
        <div class="store-details">
          Address: ${storeAddress}<br>
          Contact: ${storePhone}<br>
          GST: ${storeGST}
        </div>
      </div>
    </div>

    <div class="customer-info">
      <div class="customer-left">
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span>${bill.customerName || 'CASH CUSTOMER'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span>${bill.customerPhone || 'N/A'}</span>
        </div>
      </div>
      <div class="invoice-right">
        <div class="info-row">
          <span class="info-label">Invoice No.:</span>
          <span>${bill.billNo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span>${new Date(bill.createdAt).toLocaleDateString('en-GB')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time:</span>
          <span>${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Item Name</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items.map((item: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>₹${(item.price || 0).toFixed(2)}</td>
          <td>₹${(item.total || 0).toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="amount-words">
        <strong>Thank you for shopping with us!</strong><br>
        Visit us again soon.
      </div>
      <div class="amount-numbers">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${(bill.subtotal || 0).toFixed(2)}</span>
        </div>
        ${(bill.discountAmount && bill.discountAmount > 0) ? `
        <div class="total-row">
          <span>Discount:</span>
          <span>-₹${(bill.discountAmount || 0).toFixed(2)}</span>
        </div>
        ` : ''}
        ${(bill.tax && bill.tax > 0) ? `
        <div class="total-row">
          <span>Tax:</span>
          <span>₹${(bill.tax || 0).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>TOTAL:</span>
          <span>₹${(bill.total || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>For support: ${storePhone}</p>
    </div>
  </div>
</body>
</html>
`

    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Error generating public receipt:', error)
    return new NextResponse('Error generating receipt', { status: 500 })
  }
}