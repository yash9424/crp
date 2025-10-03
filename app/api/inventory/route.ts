import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'
import { checkProductLimit } from '@/lib/plan-limits'

export const GET = withFeatureAccess('inventory')(async function() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const inventory = await inventoryCollection.find({}).sort({ createdAt: -1 }).toArray()
    
    const formattedInventory = inventory.map(item => ({
      ...item,
      id: item._id.toString()
    }))
    
    return NextResponse.json(formattedInventory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
})

export const POST = withFeatureAccess('inventory')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check product limit before adding
    const limitCheck = await checkProductLimit(session.user.tenantId)
    if (!limitCheck.canAdd) {
      return NextResponse.json({ 
        error: 'PRODUCT_LIMIT_EXCEEDED',
        message: limitCheck.message,
        limits: limitCheck.limits
      }, { status: 403 })
    }

    const body = await request.json()
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    const item = {
      ...body,
      name: body.name || 'Unnamed Product',
      sku: body.sku || `SKU-${Date.now()}`,
      category: body.category || 'General',
      price: parseFloat(body.price || 0),
      costPrice: parseFloat(body.costPrice || 0),
      stock: parseInt(body.stock || 0),
      minStock: parseInt(body.minStock || 0),
      sizes: body.sizes || [],
      colors: body.colors || [],
      brand: body.brand || '',
      material: body.material || '',
      description: body.description || '',
      tenantId: session.user.tenantId,
      storeId: session.user.tenantId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await inventoryCollection.insertOne(item)
    
    return NextResponse.json({ ...item, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
})