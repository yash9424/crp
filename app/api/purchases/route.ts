import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'

export const GET = withFeatureAccess('purchases')(async function() {
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
})

export const POST = withFeatureAccess('purchases')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    
    // Get tax rate from settings
    const settings = await settingsCollection.findOne({}) || { taxRate: 0 }
    const taxRate = (settings.taxRate || 0) / 100
    
    const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const tax = subtotal * taxRate
    const total = subtotal + tax
    
    const purchase = {
      ...body,
      subtotal,
      tax,
      total,
      tenantId: session.user.tenantId,
      createdBy: session.user.name,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await purchasesCollection.insertOne(purchase)
    
    return NextResponse.json({ 
      ...purchase, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
})