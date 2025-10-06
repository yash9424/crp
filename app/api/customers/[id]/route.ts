import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'
import { ObjectId } from 'mongodb'

export const PUT = withFeatureAccess('customers')(async function(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email, address } = body
    
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    
    const result = await customersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          name: name.trim(),
          phone: phone || null,
          email: email || null,
          address: address || null,
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Customer updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
})

export const DELETE = withFeatureAccess('customers')(async function(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    
    const result = await customersCollection.deleteOne({
      _id: new ObjectId(params.id)
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
})