import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, customerName, customerPhone, subtotal, discount, discountAmount, tax, total, paymentMethod, taxRate, storeName, staffMember } = body

    const db = await connectDB()
    const salesCollection = db.collection(`sales_${session.user.tenantId}`)
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    const settingsCollection = db.collection(`settings_${session.user.tenantId}`)
    
    // Get store settings
    const storeSettings = await settingsCollection.findOne({}) || { storeName: 'Store', taxRate: 10 }
    
    // Generate sequential bill number
    const currentCounter = storeSettings.billCounter || 1
    const billNo = `${storeSettings.billPrefix || 'BILL'}-${currentCounter.toString().padStart(3, '0')}`
    
    // Increment counter for next bill
    await settingsCollection.updateOne(
      {},
      { $inc: { billCounter: 1 } },
      { upsert: true }
    )

    // Create sale record with all data
    const sale = {
      billNo,
      items: items || [],
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total) || 0,
      paymentMethod: paymentMethod || 'cash',
      storeName: storeName || storeSettings.storeName || 'Store',
      address: storeSettings.address || '',
      phone: storeSettings.phone || '',
      email: storeSettings.email || '',
      gst: storeSettings.gst || '',
      taxRate: taxRate || storeSettings.taxRate || 10,
      terms: storeSettings.terms || '',
      billPrefix: storeSettings.billPrefix || 'BILL',
      tenantId: session.user.tenantId,
      cashier: session.user.name || 'Admin',
      staffMember: staffMember || 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Update inventory stock and validate
    for (const item of items) {
      try {
        const inventoryItem = await inventoryCollection.findOne({ _id: new ObjectId(item.id) })
        
        if (!inventoryItem) {
          return NextResponse.json({ 
            error: `Product ${item.name} not found in inventory` 
          }, { status: 400 })
        }
        
        if (inventoryItem.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${item.name}. Available: ${inventoryItem.stock}` 
          }, { status: 400 })
        }
        
        await inventoryCollection.updateOne(
          { _id: new ObjectId(item.id) },
          { 
            $inc: { stock: -item.quantity },
            $set: { updatedAt: new Date() }
          }
        )
      } catch (err) {
        console.error('Inventory update error:', err)
        return NextResponse.json({ 
          error: `Error updating inventory for ${item.name}` 
        }, { status: 500 })
      }
    }

    const result = await salesCollection.insertOne(sale)
    
    // Update customer total spent and order count
    if (customerName && customerName.trim()) {
      const customersCollection = db.collection(`customers_${session.user.tenantId}`)
      
      // Check if customer exists, if not create with orderCount: 1
      const existingCustomer = await customersCollection.findOne({
        $or: [
          { phone: customerPhone },
          { name: customerName }
        ]
      })
      
      if (existingCustomer) {
        await customersCollection.updateOne(
          { _id: existingCustomer._id },
          { 
            $inc: { 
              totalSpent: parseFloat(total) || 0,
              orderCount: 1
            },
            $set: { 
              lastOrderDate: new Date(),
              updatedAt: new Date() 
            }
          }
        )
      } else {
        // Create new customer with orderCount starting at 1
        await customersCollection.insertOne({
          name: customerName,
          phone: customerPhone || null,
          orderCount: 1,
          totalSpent: parseFloat(total) || 0,
          lastOrderDate: new Date(),
          tenantId: session.user.tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    
    return NextResponse.json({ 
      ...sale, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    console.error('POS sales error:', error)
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    const db = await connectDB()
    const salesCollection = db.collection(`sales_${session.user.tenantId}`)
    
    let query = {}
    if (search) {
      query = {
        $or: [
          { billNo: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } }
        ]
      }
    }
    
    const sales = await salesCollection.find(query).sort({ createdAt: -1 }).limit(50).toArray()
    
    const formattedSales = sales.map(sale => ({
      ...sale,
      id: sale._id.toString()
    }))
    
    return NextResponse.json(formattedSales)
  } catch (error) {
    console.error('Fetch sales error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}