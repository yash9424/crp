import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch the actual bill from database
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const bill = await salesCollection.findOne({ _id: new ObjectId(billId) })
    
    if (!bill) {
      return new NextResponse('Bill not found', { status: 404 })
    }

    // Fetch store settings
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    const settings = await settingsCollection.findOne({ type: 'store-settings' }) || {}

    // Generate HTML content for PDF
    const storeName = (settings as any).storeName || bill.storeName || 'Store'
    const storeAddress = (settings as any).address || bill.address || 'Store Address'
    const storePhone = (settings as any).phone || bill.phone || '9427300816'
    const storeGST = (settings as any).gst || bill.gst || 'GST1234456'
    const storeEmail = (settings as any).email || bill.email || 'store@gmail.com'
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${bill.billNo}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { 
      font-family: 'Courier New', monospace; 
      max-width: 300px; 
      margin: 0 auto; 
      padding: 8px; 
      font-size: 10px; 
      line-height: 1.2;
      background: white;
      color: black;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .store-name {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .store-info {
      font-size: 9px;
      line-height: 1.3;
    }
    .bill-info {
      margin: 8px 0;
      font-size: 9px;
    }
    .bill-info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .separator {
      border-bottom: 1px dashed #000;
      margin: 10px 0;
    }
    .double-separator {
      border-bottom: 2px solid #000;
      margin: 10px 0;
    }
    .items-header {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1fr 1fr;
      gap: 2px;
      font-weight: bold;
      font-size: 8px;
      text-align: center;
      margin-bottom: 3px;
      padding: 3px 0;
      background: #f0f0f0;
    }
    .item-row {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1fr 1fr;
      gap: 2px;
      font-size: 8px;
      margin: 2px 0;
      padding: 1px 0;
    }
    .item-name {
      font-weight: bold;
      text-align: left;
    }
    .item-qty, .item-rate, .item-amount {
      text-align: center;
    }
    .totals {
      margin-top: 15px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 9px;
    }
    .subtotal-row {
      padding: 3px 0;
    }
    .tax-row {
      padding: 3px 0;
      font-style: italic;
    }
    .discount-row {
      padding: 3px 0;
      color: #d00;
    }
    .final-total {
      font-weight: bold;
      font-size: 11px;
      padding: 4px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin: 4px 0;
    }
    .payment-info {
      margin: 6px 0;
      text-align: center;
      font-size: 9px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 8px;
      line-height: 1.3;
    }
    .thank-you {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .terms {
      font-size: 7px;
      margin: 8px 0;
      text-align: justify;
      line-height: 1.2;
      padding: 4px;
      background: #f9f9f9;
      border: 1px solid #ddd;
    }
    .powered-by {
      font-size: 10px;
      color: #666;
      margin-top: 15px;
      font-style: italic;
    }
    .currency {
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="store-name">${storeName}</div>
    <div class="store-info">
      <div>${storeAddress}</div>
      <div>Phone: ${storePhone}</div>
      <div>GST No: ${storeGST}</div>
      <div>Email: ${storeEmail}</div>
    </div>
  </div>
  
  <div class="bill-info">
    <div class="bill-info-row">
      <span><strong>Receipt No:</strong></span>
      <span><strong>${bill.billNo}</strong></span>
    </div>
    <div class="bill-info-row">
      <span>Date:</span>
      <span>${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
    </div>
    <div class="bill-info-row">
      <span>Time:</span>
      <span>${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
    </div>
    <div class="bill-info-row">
      <span>Cashier:</span>
      <span>Admin</span>
    </div>
    ${bill.customerName ? `
    <div class="bill-info-row">
      <span>Customer:</span>
      <span>${bill.customerName}</span>
    </div>
    ` : ''}
    ${bill.customerPhone ? `
    <div class="bill-info-row">
      <span>Phone:</span>
      <span>${bill.customerPhone}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="double-separator"></div>
  
  <div class="items-header">
    <div>ITEM</div>
    <div>QTY</div>
    <div>RATE</div>
    <div>AMOUNT</div>
  </div>
  
  ${bill.items.map((item: any) => `
    <div class="item-row">
      <div class="item-name">${item.name}</div>
      <div class="item-qty">${item.quantity}</div>
      <div class="item-rate">${(item.price || 0)}</div>
      <div class="item-amount"><span class="currency">₹</span>${(item.total || 0)}</div>
    </div>
  `).join('')}
  
  <div class="separator"></div>
  
  <div class="totals">
    <div class="total-row subtotal-row">
      <span>Subtotal:</span>
      <span><span class="currency">₹</span>${(bill.subtotal || 0).toFixed(2)}</span>
    </div>
    ${(bill.discountAmount && bill.discountAmount > 0) ? `
    <div class="total-row discount-row">
      <span>Discount:</span>
      <span>- <span class="currency">₹</span>${bill.discountAmount.toFixed(2)}</span>
    </div>
    ` : ''}
    ${(bill.tax && bill.tax > 0) ? `
    <div class="total-row tax-row">
      <span>Tax:</span>
      <span><span class="currency">₹</span>${bill.tax.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row final-total">
      <span>TOTAL AMOUNT:</span>
      <span><span class="currency">₹</span>${(bill.total || 0).toFixed(2)}</span>
    </div>
  </div>
  
  <div class="payment-info">
    <strong>Payment Method: ${bill.paymentMethod || 'Cash'}</strong>
  </div>
  
  ${((settings as any).terms || bill.terms) ? `
    <div class="terms">
      <strong>Terms & Conditions:</strong><br>
      ${(settings as any).terms || bill.terms}
    </div>
  ` : ''}
  
  <div class="double-separator"></div>
  
  <div class="footer">
    <div class="thank-you">🙏 THANK YOU FOR YOUR PURCHASE! 🙏</div>
    <div>Please visit us again</div>
    <div>For any queries: ${storePhone}</div>
    <div style="margin-top: 10px; font-size: 11px;">
      <strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt
    </div>
    <div class="powered-by">
      Powered by Fashion ERP System
    </div>
  </div>
  
  <script>
    window.onload = function() {
      // Auto print after 1 second
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  </script>
</body>
</html>
`

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Error generating bill PDF:', error)
    return new NextResponse('Error generating bill', { status: 500 })
  }
}