import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
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
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    // Get the purchase order
    const purchase = await purchasesCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // If status is being changed to 'completed', add items to inventory
    if (body.status === 'completed' && purchase.status !== 'completed') {
      for (const item of purchase.items) {
        // Check if item already exists in inventory
        const existingItem = await inventoryCollection.findOne({ sku: item.sku })
        
        if (existingItem) {
          // Update existing item stock and ensure all fields are preserved/updated
          await inventoryCollection.updateOne(
            { sku: item.sku },
            { 
              $inc: { stock: parseInt(item.quantity || 0) },
              $set: { 
                name: item.name || existingItem.name || 'Unnamed Product',
                category: item.category || existingItem.category || 'General',
                sizes: item.sizes ? item.sizes.split(',').map(s => s.trim()) : existingItem.sizes || [],
                colors: item.colors ? item.colors.split(',').map(c => c.trim()) : existingItem.colors || [],
                brand: item.brand || existingItem.brand || '',
                material: item.material || existingItem.material || '',
                updatedAt: new Date() 
              }
            }
          )
        } else {
          // Create new inventory item with all required fields
          const newInventoryItem = {
            name: item.name || `Product from PO ${purchase.poNumber}`,
            sku: item.sku || `SKU-${Date.now()}`,
            category: item.category || 'General',
            price: 0, // Will be set later manually
            costPrice: 0, // Will be set later manually
            stock: parseInt(item.quantity || 0),
            minStock: 5, // Default minimum stock
            sizes: item.sizes ? item.sizes.split(',').map(s => s.trim()) : [],
            colors: item.colors ? item.colors.split(',').map(c => c.trim()) : [],
            brand: item.brand || '',
            material: item.material || '',
            description: `Added from Purchase Order ${purchase.poNumber}`,
            status: 'active',
            tenantId: session.user.tenantId,
            storeId: session.user.tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          console.log('Creating inventory item:', newInventoryItem)
          
          await inventoryCollection.insertOne(newInventoryItem)
        }
      }
    }

    // Update purchase status
    const result = await purchasesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          status: body.status,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Purchase order updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}