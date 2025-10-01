import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const billId = searchParams.get('id')
    
    if (!billId) {
      return new NextResponse('Bill ID required', { status: 400 })
    }
    
    // Create a test bill for now
    const bill = {
      billNo: 'TEST-001',
      storeName: 'Fashion Store',
      address: 'Store Address',
      phone: '9427300816',
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      items: [
        { name: 'Test Item', quantity: 1, price: 100, total: 100 }
      ],
      subtotal: 100,
      tax: 18,
      total: 118,
      paymentMethod: 'Cash',
      createdAt: new Date().toISOString()
    }

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.billNo}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 400px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            th, td { 
              padding: 5px; 
              text-align: left; 
              border-bottom: 1px solid #ddd;
            }
            th { border-bottom: 2px solid #000; }
            .totals { 
              border-top: 2px solid #000; 
              padding-top: 10px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              border-top: 1px dashed #000; 
              padding-top: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${bill.storeName || 'Store'}</h2>
            <p>${bill.address || 'Store Address'}</p>
            <p>Phone: ${bill.phone || '9427300816'}</p>
          </div>
          
          <div>
            <p><strong>Bill No:</strong> ${bill.billNo}</p>
            <p><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
            <p><strong>Customer:</strong> ${bill.customerName}</p>
            ${bill.customerPhone ? `<p><strong>Phone:</strong> ${bill.customerPhone}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price?.toFixed(2) || '0.00'}</td>
                  <td>₹${(item.total || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <p>Subtotal: ₹${(bill.subtotal || 0).toFixed(2)}</p>
            <p>Tax: ₹${(bill.tax || 0).toFixed(2)}</p>
            <p><strong>Total: ₹${(bill.total || 0).toFixed(2)}</strong></p>
            <p>Payment: ${bill.paymentMethod}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Contact: 9427300816</p>
          </div>
          
          <script>
            window.onload = function() {
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
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Error generating bill PDF:', error)
    return new NextResponse('Error generating bill', { status: 500 })
  }
}