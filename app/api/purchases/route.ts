import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')
    const purchases = await purchasesCollection.find({}).sort({ createdAt: -1 }).toArray()
    
    const formattedPurchases = purchases.map(purchase => ({
      ...purchase,
      id: purchase._id.toString()
    }))
    
    return NextResponse.json(formattedPurchases)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    const purchase = {
      ...body,
      tenantId: session.user.tenantId,
      createdBy: session.user.name,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await purchasesCollection.insertOne(purchase)
    
    // Update inventory stock for each item
    for (const item of body.items) {
      if (item.updateInventory) {
        await inventoryCollection.updateOne(
          { sku: item.sku },
          { 
            $inc: { stock: parseInt(item.quantity) },
            $set: { 
              costPrice: parseFloat(item.unitPrice),
              updatedAt: new Date() 
            }
          },
          { upsert: true }
        )
      }
    }
    
    return NextResponse.json({ 
      ...purchase, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}