import { NextRequest, NextResponse } from 'next/server'
import { getTenantsCollection } from '@/lib/database'
import { ObjectId } from 'mongodb'

// PATCH - Update tenant status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const tenantsCollection = await getTenantsCollection()
    
    const result = await tenantsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: `Tenant ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      status 
    })
  } catch (error) {
    console.error('Failed to update tenant status:', error)
    return NextResponse.json({ error: 'Failed to update tenant status' }, { status: 500 })
  }
}