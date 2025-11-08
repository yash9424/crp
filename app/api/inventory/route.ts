import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBarcode } from '@/lib/barcode-utils'

export async function GET() {
  try {
    console.log('Fetching inventory...')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.tenantId)
    
    if (!session?.user?.tenantId) {
      console.log('No tenant ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Connecting to database...')
    const db = await connectDB()
    const collectionName = `products_${session.user.tenantId}`
    console.log('Using collection:', collectionName)
    
    const inventoryCollection = db.collection(collectionName)
    const inventory = await inventoryCollection.find({}).sort({ createdAt: -1 }).toArray()
    console.log('Found items:', inventory.length)
    
    const formattedInventory = inventory.map(item => ({
      ...item,
      id: item._id.toString(),
      minStock: item.minStock || item.min_stock || item['Min Stock'] || 0
    }))
    
    return NextResponse.json(formattedInventory)
  } catch (error) {
    console.error('Inventory fetch error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      error: 'Failed to fetch inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Product creation request:', body)
    
    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    
    // Use provided barcode or generate one
    const mainBarcode = body.barcode || generateBarcode('FS')
    console.log('Using barcode:', mainBarcode)
    
    // Check if main barcode already exists
    const existingProduct = await inventoryCollection.findOne({ barcode: mainBarcode })
    if (existingProduct) {
      console.log('Barcode already exists:', mainBarcode)
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 400 })
    }
    
    // Get tenant field configuration
    const tenantFieldsCollection = db.collection('tenant_fields')
    const tenantConfig = await tenantFieldsCollection.findOne({ tenantId: session.user.tenantId })
    
    // Base item structure
    const item: any = {
      name: body.name || 'Unnamed Product',
      sku: body.sku || `SKU-${Date.now()}`,
      barcode: mainBarcode,
      category: body.category || 'General',
      price: parseFloat(body.finalPrice || body.price || 0),
      originalPrice: parseFloat(body.price || 0),
      costPrice: parseFloat(body.costPrice || 0),
      stock: parseInt(body.stock || 0),
      minStock: parseInt(body.minStock || body.min_stock || body['Min Stock'] || 0),
      min_stock: parseInt(body.minStock || body.min_stock || body['Min Stock'] || 0),
      tenantId: session.user.tenantId,
      storeId: session.user.tenantId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add dynamic fields based on tenant configuration
    if (tenantConfig?.fields) {
      tenantConfig.fields.forEach((field: any) => {
        if (field.enabled) {
          const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
          const fieldName = field.name
          
          // Try multiple field name variations
          let fieldValue = body[fieldKey] || body[fieldName] || body[fieldName.toLowerCase()]
          
          if (fieldValue !== undefined && fieldValue !== '') {
            // Handle array fields (sizes, colors)
            if (field.type === 'text' && (fieldName.toLowerCase().includes('size') || fieldName.toLowerCase().includes('color'))) {
              if (typeof fieldValue === 'string') {
                item[fieldKey] = fieldValue.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              } else {
                item[fieldKey] = fieldValue
              }
            } else if (field.type === 'number') {
              item[fieldKey] = parseFloat(fieldValue) || 0
            } else {
              item[fieldKey] = fieldValue
            }
          }
        }
      })
    }

    // Keep backward compatibility for existing fields
    const backwardCompatFields = ['sizes', 'colors', 'brand', 'material', 'description']
    backwardCompatFields.forEach(fieldName => {
      if (body[fieldName] !== undefined && body[fieldName] !== '') {
        if (fieldName === 'sizes' || fieldName === 'colors') {
          item[fieldName] = Array.isArray(body[fieldName]) ? body[fieldName] : body[fieldName].split(',').map((s: string) => s.trim()).filter((s: string) => s)
        } else {
          item[fieldName] = body[fieldName]
        }
      }
    })

    console.log('Creating product item:', JSON.stringify(item, null, 2))
    console.log('Tenant config fields:', tenantConfig?.fields?.map(f => ({ name: f.name, enabled: f.enabled })))
    console.log('Request body keys:', Object.keys(body))
    
    const result = await inventoryCollection.insertOne(item)
    console.log('Product created successfully:', result.insertedId)
    console.log('Final item stored:', JSON.stringify(item, null, 2))
    
    return NextResponse.json({ ...item, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create inventory item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}