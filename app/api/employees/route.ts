import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'

export const GET = withFeatureAccess('hr')(async function() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const employees = await employeesCollection.find({ tenantId: session.user.tenantId }).toArray()
    
    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
})

export const POST = withFeatureAccess('hr')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    const employee = {
      ...body,
      department: 'General',
      position: 'Employee',
      commissionType: body.commissionType || 'none',
      commissionRate: parseFloat(body.commissionRate) || 0,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'Active'
    }
    
    const result = await employeesCollection.insertOne(employee)
    
    return NextResponse.json({ 
      message: 'Employee created successfully',
      employeeId: result.insertedId 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
})