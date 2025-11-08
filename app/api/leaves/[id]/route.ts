import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    const result = await leavesCollection.deleteOne({
      _id: new ObjectId(params.id),
      tenantId: session.user.tenantId
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Leave record not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Leave record deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete leave record' }, { status: 500 })
  }
}