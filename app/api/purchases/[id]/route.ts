import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')
    
    // Get the purchase order
    const purchase = await purchasesCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Update purchase order fields
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // If updating general fields
    if (body.supplierName) updateData.supplierName = body.supplierName
    if (body.supplierContact) updateData.supplierContact = body.supplierContact
    if (body.supplierContactNo) updateData.supplierContactNo = body.supplierContactNo
    if (body.orderDate) updateData.orderDate = body.orderDate
    if (body.notes) updateData.notes = body.notes
    if (body.items) updateData.items = body.items
    if (body.status) updateData.status = body.status
    
    // If status is being changed to 'completed', update inventory stock
    if (body.status === 'completed' && purchase.status !== 'completed') {
      console.log('=== PURCHASE COMPLETION START ===')
      console.log('Purchase items:', JSON.stringify(purchase.items, null, 2))
      
      if (!purchase.items || purchase.items.length === 0) {
        return NextResponse.json({ error: 'No items found in purchase order' }, { status: 400 })
      }
      
      const db = await connectDB()
      const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
      
      for (const item of purchase.items) {
        const quantityToAdd = Number(item.quantity) || 0
        
        if (quantityToAdd <= 0) continue
        
        let existingItem = null
        
        // Try to find existing item by SKU first (most reliable)
        if (item.sku?.trim()) {
          existingItem = await inventoryCollection.findOne({ 
            sku: { $regex: new RegExp(`^${item.sku.trim()}$`, 'i') } 
          })
        }
        
        // If not found by SKU, try by exact name match
        if (!existingItem && item.name?.trim()) {
          existingItem = await inventoryCollection.findOne({ 
            name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') } 
          })
        }
        
        if (existingItem) {
          // Update existing item stock
          await inventoryCollection.updateOne(
            { _id: existingItem._id },
            { 
              $inc: { stock: quantityToAdd },
              $set: { updatedAt: new Date() }
            }
          )
          console.log(`Updated stock for ${existingItem.name}: +${quantityToAdd}`)
        } else {
          // Create new inventory item
          const newInventoryItem = {
            name: item.name || `Product from PO ${purchase.poNumber}`,
            sku: item.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            barcode: `FS${Date.now()}`,
            category: 'General',
            price: Number(item.unitPrice) || 0,
            costPrice: Number(item.unitPrice) || 0,
            stock: quantityToAdd,
            minStock: 5,
            description: `Added from Purchase Order ${purchase.poNumber}`,
            status: 'active',
            tenantId: session.user.tenantId,
            storeId: session.user.tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await inventoryCollection.insertOne(newInventoryItem)
          console.log(`Created new inventory item: ${newInventoryItem.name}`)
        }
      }
      console.log('=== PURCHASE COMPLETION END ===')
    }

    // Update purchase order
    const result = await purchasesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Purchase order updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')
    
    const result = await purchasesCollection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}