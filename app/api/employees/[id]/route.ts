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
    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    await employeesCollection.updateOne(
      { _id: new ObjectId(params.id), tenantId: session.user.tenantId },
      { 
        $set: { 
          ...body,
          updatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({ message: 'Employee updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    await employeesCollection.deleteOne({
      _id: new ObjectId(params.id),
      tenantId: session.user.tenantId
    })
    
    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}