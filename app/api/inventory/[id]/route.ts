import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Update request body:', JSON.stringify(body, null, 2))
    
    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    
    // Get tenant field configuration
    const tenantFieldsCollection = db.collection('tenant_fields')
    const tenantConfig = await tenantFieldsCollection.findOne({ tenantId: session.user.tenantId })
    
    // Base update data
    const updateData: any = {
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
                updateData[fieldKey] = fieldValue.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              } else {
                updateData[fieldKey] = fieldValue
              }
            } else if (field.type === 'number') {
              updateData[fieldKey] = parseFloat(fieldValue) || 0
            } else {
              updateData[fieldKey] = fieldValue
            }
          }
        }
      })
    }
    
    // Always process name field even if empty to allow clearing
    if (body.name !== undefined) {
      updateData.name = body.name || 'Unnamed Product'
    }
    
    // Keep backward compatibility for existing fields
    const backwardCompatFields = ['sku', 'barcode', 'category', 'price', 'costPrice', 'stock', 'minStock', 'sizes', 'colors', 'brand', 'material', 'description']
    backwardCompatFields.forEach(fieldName => {
      if (body[fieldName] !== undefined && body[fieldName] !== '') {
        if (fieldName === 'price' || fieldName === 'costPrice') {
          updateData[fieldName] = parseFloat(body[fieldName]) || 0
        } else if (fieldName === 'stock' || fieldName === 'minStock') {
          updateData[fieldName] = parseInt(body[fieldName]) || 0
        } else if (fieldName === 'sizes' || fieldName === 'colors') {
          if (typeof body[fieldName] === 'string') {
            updateData[fieldName] = body[fieldName].split(',').map((s: string) => s.trim()).filter((s: string) => s)
          } else {
            updateData[fieldName] = body[fieldName]
          }
        } else {
          updateData[fieldName] = body[fieldName]
        }
      }
    })
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2))

    const result = await inventoryCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Item updated successfully' })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    
    const result = await inventoryCollection.deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}