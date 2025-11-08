import { NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    // Find products with missing or zero selling price
    const productsToUpdate = await inventoryCollection.find({
      $or: [
        { price: { $exists: false } },
        { price: 0 },
        { price: null }
      ],
      costPrice: { $gt: 0 }
    }).toArray()

    let updateCount = 0

    for (const product of productsToUpdate) {
      const sellingPrice = parseFloat(product.costPrice) * 1.5 // 50% markup
      
      await inventoryCollection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            price: sellingPrice,
            updatedAt: new Date()
          }
        }
      )
      updateCount++
    }

    return NextResponse.json({ 
      message: `Updated ${updateCount} products with selling prices`,
      count: updateCount 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prices' }, { status: 500 })
  }
}