import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { withFeatureAccess } from '@/lib/api-middleware'

export const POST = withFeatureAccess('pos')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, customerName, customerPhone, subtotal, discount, discountAmount, tax, total, paymentMethod, taxRate, storeName } = body

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    
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
        return NextResponse.json({ 
          error: `Error updating inventory for ${item.name}` 
        }, { status: 500 })
      }
    }

    const result = await salesCollection.insertOne(sale)
    
    // Update customer total spent
    if (customerName && customerName.trim()) {
      const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
      await customersCollection.updateOne(
        { 
          $or: [
            { phone: customerPhone },
            { name: customerName }
          ]
        },
        { 
          $inc: { totalSpent: parseFloat(total) || 0 },
          $set: { updatedAt: new Date() }
        }
      )
    }
    
    return NextResponse.json({ 
      ...sale, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
  }
})

export const GET = withFeatureAccess('pos')(async function() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const sales = await salesCollection.find({}).sort({ createdAt: -1 }).limit(50).toArray()
    
    const formattedSales = sales.map(sale => ({
      ...sale,
      id: sale._id.toString()
    }))
    
    return NextResponse.json(formattedSales)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
})