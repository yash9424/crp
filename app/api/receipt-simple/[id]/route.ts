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

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const bill = await salesCollection.findOne({ _id: new ObjectId(billId) })
    
    if (!bill) {
      return new NextResponse('Bill not found', { status: 404 })
    }

    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    const settings = await settingsCollection.findOne({ type: 'store-settings' }) || {}

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
  <title>Bill - ${bill.billNo}</title>
  <style>
    body { font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 15px; font-size: 14px; line-height: 1.3; background: white; color: black; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .separator { border-bottom: 1px dashed #000; margin: 8px 0; }
    .item-name { font-weight: bold; margin-bottom: 2px; }
    .item-details { display: flex; justify-content: space-between; font-size: 12px; }
    .totals { margin-top: 10px; }
    .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .final-total { font-weight: bold; font-size: 16px; border-top: 1px solid #000; border-bottom: 1px solid #000; margin: 8px 0; padding: 8px 0; }
    .terms { font-size: 12px; margin-top: 10px; text-align: justify; line-height: 1.3; }
  </style>
</head>
<body>
  <div class="center bold">${storeName}</div>
  <div class="center">${storeAddress}</div>
  <div class="center">Phone: ${storePhone}</div>
  <div class="center">GST: ${storeGST}</div>
  <div class="center">Email: ${storeEmail}</div>
  
  <div class="separator"></div>
  
  <div>Bill No: ${bill.billNo}</div>
  <div>${new Date(bill.createdAt).toLocaleDateString('en-GB')}</div>
  <div>Time: ${new Date(bill.createdAt).toLocaleTimeString('en-IN', {hour12: true})}</div>
  <div>Cashier: Admin</div>
  ${bill.customerName ? `<div>Customer: ${bill.customerName}</div>` : ''}
  ${bill.customerPhone ? `<div>Phone: ${bill.customerPhone}</div>` : ''}
  
  <div class="separator"></div>
  
  ${bill.items.map((item: any) => `
    <div class="item-name">${item.name}</div>
    <div class="item-details">
      <span>${item.quantity} x ₹${(item.price || 0).toFixed(2)}</span>
      <span>₹${(item.total || 0).toFixed(2)}</span>
    </div>
  `).join('')}
  
  <div class="separator"></div>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>₹${(bill.subtotal || 0).toFixed(2)}</span>
    </div>
    ${(bill.discountAmount && bill.discountAmount > 0) ? `
    <div class="total-row">
      <span>Discount:</span>
      <span>₹${bill.discountAmount.toFixed(2)}</span>
    </div>
    ` : ''}
    ${(bill.tax && bill.tax > 0) ? `
    <div class="total-row">
      <span>Tax:</span>
      <span>₹${bill.tax.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row final-total">
      <span>TOTAL:</span>
      <span>₹${(bill.total || 0).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Payment Mode:</span>
      <span>${bill.paymentMethod || 'Cash'}</span>
    </div>
  </div>
  
  ${((settings as any).terms || bill.terms) ? `
    <div class="separator"></div>
    <div class="bold">Terms & Conditions:</div>
    <div class="terms">${(settings as any).terms || bill.terms}</div>
  ` : ''}
  
  <div class="separator"></div>
  
  <div class="center">
    <div class="bold">Thank you for shopping with us!</div>
    <div>Visit again soon</div>
    <div>For support: ${storePhone}</div>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
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
    console.error('Error generating bill:', error)
    return new NextResponse('Error generating bill', { status: 500 })
  }
}