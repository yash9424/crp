import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      // Return empty array for unauthenticated users
      return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    const total = await employeesCollection.countDocuments({})
    const employees = await employeesCollection.find({}).skip(skip).limit(limit).toArray()
    
    return NextResponse.json({
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Employees fetch error:', error)
    // Return empty array on error
    return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    
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
    
    console.log('Creating employee:', employee)
    const result = await employeesCollection.insertOne(employee)
    console.log('Employee created with ID:', result.insertedId)
    
    return NextResponse.json({ 
      message: 'Employee created successfully',
      employeeId: result.insertedId,
      employee: { ...employee, id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error('Employee creation error:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}