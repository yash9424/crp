import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productType, batchId, qcId, quantity } = await request.json()
    
    // Generate barcode number
    const barcode = `${batchId}${qcId}${Date.now().toString().slice(-6)}`
    
    // Save barcode to inventory
    try {
      const db = await connectDB()
      const collection = db.collection(`tenant_${session.user.tenantId}_inventory`)
      await collection.updateOne(
        { batchId, qcId },
        { $set: { barcode, updatedAt: new Date() } }
      )
    } catch (dbError) {
      console.error('Failed to save barcode:', dbError)
    }
    
    // Create HTML content with real barcode using JsBarcode CDN
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Barcode - ${barcode}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .barcode-container { text-align: center; padding: 10px; background: white; }
            .product-name { font-size: 12px; font-weight: bold; margin-top: 5px; }
            @media print {
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
                .barcode-container { padding: 5px; }
                .product-name { font-size: 10px; }
            }
        </style>
    </head>
    <body>
        <div class="barcode-container">
            <svg id="barcode"></svg>
            <div class="product-name">${productType}</div>
        </div>
        <script>
            window.onload = function() {
                // Generate real barcode
                JsBarcode("#barcode", "${barcode}", {
                    format: "CODE128",
                    width: 1.5,
                    height: 50,
                    displayValue: false,
                    margin: 5
                });
                
                // Auto print after barcode is generated
                setTimeout(() => {
                    window.print();
                }, 1000);
            }
        </script>
    </body>
    </html>`

    return NextResponse.json({ 
      success: true, 
      barcode, 
      htmlContent 
    })
  } catch (error) {
    console.error('Barcode generation error:', error)
    return NextResponse.json({ error: 'Failed to generate barcode' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const db = await connectDB()
    const inventoryCollection = db.collection(`tenant_${session.user.tenantId}_inventory`)
    const product = await inventoryCollection.findOne({ _id: new ObjectId(productId) })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const barcodeData = {
      id: product._id.toString(),
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      sku: product.sku
    }

    return NextResponse.json(barcodeData)
  } catch (error) {
    console.error('Barcode fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch barcode data' }, { status: 500 })
  }
}