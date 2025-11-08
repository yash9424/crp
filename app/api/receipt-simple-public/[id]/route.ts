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

    // Generate simple receipt HTML
    const storeName = (settings as any).storeName || bill.storeName || 'Fashion Store'
    const storeAddress = (settings as any).address || bill.address || 'Store Address'
    const storePhone = (settings as any).phone || bill.phone || '9427300816'
    
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${bill.billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      background: white; 
      padding: 10px;
      color: #000;
      font-size: 14px;
      line-height: 1.4;
    }
    .receipt {
      max-width: 400px;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 15px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .store-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .store-details {
      font-size: 12px;
    }
    .bill-info {
      margin-bottom: 10px;
      font-size: 12px;
    }
    .items {
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .item-name {
      flex: 1;
      margin-right: 10px;
    }
    .item-details {
      text-align: right;
    }
    .totals {
      font-size: 12px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .final-total {
      font-weight: bold;
      font-size: 14px;
      border-top: 1px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="store-name">${storeName}</div>
      <div class="store-details">
        ${storeAddress}<br>
        Phone: ${storePhone}
      </div>
    </div>

    <div class="bill-info">
      <div>Bill No: ${bill.billNo}</div>
      <div>Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}</div>
      <div>Time: ${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour12: true })}</div>
      ${bill.customerName ? `<div>Customer: ${bill.customerName}</div>` : ''}
      ${bill.customerPhone ? `<div>Phone: ${bill.customerPhone}</div>` : ''}
    </div>

    <div class="items">
      ${bill.items.map((item: any) => `
      <div class="item">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}
        </div>
      </div>
      `).join('')}
    </div>

    <div class="totals">
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
      <div class="total-row final-total">
        <span>TOTAL:</span>
        <span>₹${(bill.total || 0).toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <div><strong>Thank you for your business!</strong></div>
      <div>Visit us again soon</div>
      <div>Support: ${storePhone}</div>
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
    console.error('Error generating simple public receipt:', error)
    return new NextResponse('Error generating receipt', { status: 500 })
  }
}