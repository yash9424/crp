import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    let query: any = { tenantId: session.user.tenantId }
    
    if (employeeId) query.employeeId = employeeId
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      query.startDate = { $gte: startDate.toISOString().split('T')[0] }
      query.endDate = { $lte: endDate.toISOString().split('T')[0] }
    }
    
    const leaves = await leavesCollection.find(query).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json(leaves)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    const leave = {
      ...body,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'Approved'
    }
    
    const result = await leavesCollection.insertOne(leave)
    
    return NextResponse.json({ 
      message: 'Leave request created successfully',
      leaveId: result.insertedId 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 })
  }
}