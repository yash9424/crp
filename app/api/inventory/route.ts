import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'
import { checkProductLimit } from '@/lib/plan-limits'
import { generateBarcode } from '@/lib/barcode-utils'

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
    console.log('Product creation request:', body)
    
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    // Use provided barcode or generate one
    const mainBarcode = body.barcode || generateBarcode('FS')
    console.log('Using barcode:', mainBarcode)
    
    // Check if main barcode already exists
    const existingProduct = await inventoryCollection.findOne({ barcode: mainBarcode })
    if (existingProduct) {
      console.log('Barcode already exists:', mainBarcode)
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 400 })
    }
    
    const item = {
      name: body.name || 'Unnamed Product',
      sku: body.sku || `SKU-${Date.now()}`,
      barcode: mainBarcode,
      category: body.category || 'General',
      price: parseFloat(body.finalPrice || body.price || 0),
      originalPrice: parseFloat(body.price || 0),
      costPrice: parseFloat(body.costPrice || 0),
      stock: parseInt(body.stock || 0),
      minStock: parseInt(body.minStock || 0),
      sizes: Array.isArray(body.sizes) ? body.sizes : (body.sizes ? body.sizes.split(',').map((s: string) => s.trim()) : []),
      colors: Array.isArray(body.colors) ? body.colors : (body.colors ? body.colors.split(',').map((c: string) => c.trim()) : []),
      brand: body.brand || '',
      material: body.material || '',
      description: body.description || '',
      tenantId: session.user.tenantId,
      storeId: session.user.tenantId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating product item:', item)
    const result = await inventoryCollection.insertOne(item)
    console.log('Product created successfully:', result.insertedId)
    
    return NextResponse.json({ ...item, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create inventory item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})