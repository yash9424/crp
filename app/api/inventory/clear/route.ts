import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    const result = await inventoryCollection.deleteMany({})
    
    return NextResponse.json({ 
      message: `Cleared ${result.deletedCount} items from inventory`,
      count: result.deletedCount 
    })
  } catch (error) {
    console.error('Clear inventory error:', error)
    return NextResponse.json({ error: 'Failed to clear inventory' }, { status: 500 })
  }
}