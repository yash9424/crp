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
    const settings = await settingsCollection.findOne({}) || {}

    // Generate professional receipt HTML
    const storeName = (settings as any).storeName || bill.storeName || 'Fashion Store'
    const storeAddress = (settings as any).address || bill.address || 'Store Address'
    const storePhone = (settings as any).phone || bill.phone || '9427300816'
    const storeGST = (settings as any).gst || bill.gst || 'GST1234567890'
    const storeEmail = (settings as any).email || bill.email || 'store@example.com'
    
    function convertToWords(num: number): string {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
      
      if (num === 0) return 'Zero'
      
      function convertHundreds(n: number): string {
        let result = ''
        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + ' Hundred '
          n %= 100
        }
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + ' '
          n %= 10
        } else if (n >= 10) {
          result += teens[n - 10] + ' '
          return result
        }
        if (n > 0) {
          result += ones[n] + ' '
        }
        return result
      }
      
      if (num >= 10000000) {
        return convertHundreds(Math.floor(num / 10000000)) + 'Crore ' + convertToWords(num % 10000000)
      } else if (num >= 100000) {
        return convertHundreds(Math.floor(num / 100000)) + 'Lakh ' + convertToWords(num % 100000)
      } else if (num >= 1000) {
        return convertHundreds(Math.floor(num / 1000)) + 'Thousand ' + convertToWords(num % 1000)
      } else {
        return convertHundreds(num)
      }
    }
    
    const amountInWords = convertToWords(Math.round(bill.total))
    
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
    .logo-section {
      text-align: right;
      font-size: 28px;
      font-weight: bold;
    }
    .invoice-type {
      display: flex;
      background: #f0f0f0;
      border-bottom: 2px solid #000;
    }
    .cash-memo, .tax-invoice, .original {
      padding: 8px 15px;
      font-weight: bold;
      font-size: 14px;
    }
    .cash-memo {
      background: #000;
      color: white;
      flex: 1;
    }
    .tax-invoice {
      flex: 2;
      text-align: center;
      border-left: 1px solid #000;
      border-right: 1px solid #000;
    }
    .original {
      flex: 1;
      text-align: right;
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
      table-layout: fixed;
    }
    .items-table th, .items-table td {
      border: 1px solid #000;
      padding: 6px 4px;
      font-size: 11px;
      vertical-align: middle;
    }
    .items-table th {
      background: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    .items-table td:first-child {
      width: 8%;
      text-align: center;
    }
    .items-table td:nth-child(2) {
      width: 50%;
      text-align: left;
      padding-left: 6px;
      word-wrap: break-word;
    }
    .items-table td:nth-child(3) {
      width: 12%;
      text-align: center;
    }
    .items-table td:nth-child(4) {
      width: 15%;
      text-align: right;
      padding-right: 6px;
    }
    .items-table td:nth-child(5) {
      width: 15%;
      text-align: right;
      padding-right: 6px;
      font-weight: 500;
    }
    .totals-section {
      display: flex;
      border-top: 2px solid #000;
    }
    .amount-words {
      flex: 2;
      padding: 15px;
      border-right: 1px solid #000;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .amount-numbers {
      flex: 1;
      padding: 12px;
      min-width: 180px;
    }
    .total-row {
      display: table;
      width: 100%;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .total-row span:first-child {
      display: table-cell;
      width: 60%;
      text-align: left;
      vertical-align: middle;
    }
    .total-row span:last-child {
      display: table-cell;
      width: 40%;
      text-align: right;
      vertical-align: middle;
      font-weight: 500;
    }
    .total-row.final {
      font-weight: bold;
      font-size: 15px;
      border-top: 2px solid #000;
      padding-top: 6px;
      margin-top: 8px;
    }
    .total-row.final span {
      font-weight: bold;
    }
    .footer {
      display: flex;
      border-top: 2px solid #000;
    }
    .terms, .signatures {
      flex: 1;
      padding: 15px;
    }
    .terms {
      border-right: 1px solid #000;
    }
    .terms h4, .signatures h4 {
      font-size: 12px;
      margin-bottom: 8px;
    }
    .terms ul {
      font-size: 10px;
      padding-left: 15px;
    }
    .signature-box {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
    }
    .declaration {
      text-align: center;
      padding: 10px;
      font-size: 10px;
      font-style: italic;
      border-top: 1px solid #000;
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
          Contact: ${storePhone} <br>
           GST: ${storeGST}
        </div>
      </div>
    </div>

    <div class="invoice-type">
      <div class="cash-memo">CASH MEMO</div>
      <div class="tax-invoice">Tax INVOICE</div>
      <div class="original">Original</div>
    </div>

    <div class="customer-info">
      <div class="customer-left">
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span>${bill.customerName || 'CASH CUSTOMER'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mo. No.:</span>
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
          <th>S.R</th>
          <th>Particulars</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items.map((item: any, index: number) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: left; padding-left: 8px;">${item.name}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right; padding-right: 8px;">₹${(item.price || 0).toFixed(2)}</td>
          <td style="text-align: right; padding-right: 8px;">₹${(item.total || 0).toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="amount-words">
        <div style="font-weight: bold; margin-bottom: 10px;">
          Rupees ${amountInWords} Only
        </div>

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
          <span>TOTAL AMOUNT:</span>
          <span>₹${(bill.total || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="terms">
        <h4>Terms & Conditions:</h4>
        ${((settings as any).terms && (settings as any).terms.trim()) ? `
        <div style="font-size: 10px; line-height: 1.4; white-space: pre-line;">${(settings as any).terms}</div>
        ` : `
        <ul>
          <li>No Exchange No Return.</li>
          <li>Agree to Receive SMS For Offers.</li>
          <li>E & O.E.</li>
          <li>Subject to ${storeName.split(' ')[0]} Jurisdiction.</li>
        </ul>
        `}
      </div>
      <div class="signatures">
        <div style="text-align: right; margin-bottom: 20px;">
          <strong>For, ${storeName.toUpperCase()}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div class="signature-box">
            Customer's Sign
          </div>
          <div class="signature-box">
            Authorised Signatory
          </div>
        </div>
      </div>
    </div>

    <div class="declaration">
      "I/We declare that this invoice shows that actual price of the goods described and that all particulars are true and correct."
    </div>
  </div>

  <script>
    function convertToWords(num) {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (num === 0) return 'Zero';
      
      function convertHundreds(n) {
        let result = '';
        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + ' Hundred ';
          n %= 100;
        }
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + ' ';
          n %= 10;
        } else if (n >= 10) {
          result += teens[n - 10] + ' ';
          return result;
        }
        if (n > 0) {
          result += ones[n] + ' ';
        }
        return result;
      }
      
      if (num >= 10000000) {
        return convertHundreds(Math.floor(num / 10000000)) + 'Crore ' + convertToWords(num % 10000000);
      } else if (num >= 100000) {
        return convertHundreds(Math.floor(num / 100000)) + 'Lakh ' + convertToWords(num % 100000);
      } else if (num >= 1000) {
        return convertHundreds(Math.floor(num / 1000)) + 'Thousand ' + convertToWords(num % 1000);
      } else {
        return convertHundreds(num);
      }
    }

    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 1000);
    };
  </script>
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
    console.error('Error generating receipt:', error)
    return new NextResponse('Error generating receipt', { status: 500 })
  }
}