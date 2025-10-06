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
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill - ${bill.billNo}</title>
  <style>
    body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 10px; font-size: 16px; line-height: 1.4; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .separator { border-bottom: 1px dashed #000; margin: 8px 0; }
    .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item-name { font-weight: bold; margin-bottom: 2px; }
    .item-details { display: flex; justify-content: space-between; font-size: 14px; }
    .totals { margin-top: 10px; }
    .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .final-total { font-weight: bold; font-size: 18px; }
    .terms { font-size: 16px; margin-top: 10px; text-align: justify; line-height: 1.3; font-weight: bold; }
  </style>
</head>
<body>
  <div class="center bold">${storeName}</div>
  <div class="center">${storeAddress}</div>
  <div class="center">Phone: ${storePhone}</div>
  <div class="center">GST: ${(settings as any).gst || bill.gst || 'GST1234456'}</div>
  <div class="center">Email: ${(settings as any).email || bill.email || 'store@gmail.com'}</div>
  
  <div class="separator"></div>
  
  <div>Bill No: ${bill.billNo}</div>
  <div>${new Date(bill.createdAt).toLocaleDateString('en-GB')}</div>
  <div>Time: ${new Date(bill.createdAt).toLocaleTimeString('en-IN', {hour12: true})}</div>
  <div>Cashier: Admin</div>
  ${bill.customerName ? `<div>Customer: ${bill.customerName}</div>` : ''}
  ${bill.customerPhone ? `<div>Phone: ${bill.customerPhone}</div>` : ''}
  
  <div class="separator"></div>
  
  <div class="item-details bold">
    <span>ITEM</span>
    <span>QTY</span>
    <span>RATE</span>
    <span>AMOUNT</span>
  </div>
  
  ${bill.items.map((item: any) => `
    <div class="item-name">${item.name}</div>
    <div class="item-details">
      <span>${item.quantity}</span>
      <span>&#8377;${(item.price || 0).toFixed(2)}</span>
      <span>&#8377;${(item.total || 0).toFixed(2)}</span>
    </div>
  `).join('')}
  
  <div class="separator"></div>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>&#8377;${(bill.subtotal || 0).toFixed(2)}</span>
    </div>
    ${(bill.taxRate || (settings as any).taxRate || 0) > 0 ? `
    <div class="total-row">
      <span>Tax:</span>
      <span>&#8377;${(bill.tax || 0).toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row final-total">
      <span>TOTAL:</span>
      <span>&#8377;${(bill.total || 0).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Payment Mode:</span>
      <span>${bill.paymentMethod || 'Cash'}</span>
    </div>
  </div>
  
  ${((settings as any).terms || bill.terms) ? `
    <div class="separator"></div>
    <div class="bold" style="font-size: 16px;">Terms & Conditions:</div>
    <div class="terms">${(settings as any).terms || bill.terms}</div>
  ` : ''}
  
  <div class="separator"></div>
  
  <div class="center">
    <div class="bold">Thank you for shopping with us!</div>
    <div>Visit again soon</div>
    <div>For support: ${storePhone}</div>
    <div style="margin-top: 8px; font-size: 12px;">Powered by Fashion POS System</div>
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
    console.error('Error generating bill PDF:', error)
    return new NextResponse('Error generating bill', { status: 500 })
  }
}