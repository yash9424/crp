import { NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const result = await inventoryCollection.deleteMany({})
    
    return NextResponse.json({ 
      message: `Cleared ${result.deletedCount} items from inventory`,
      count: result.deletedCount 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear inventory' }, { status: 500 })
  }
}