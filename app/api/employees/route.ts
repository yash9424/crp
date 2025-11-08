import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      // Return empty array for unauthenticated users
      return NextResponse.json([])
    }

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    const employees = await employeesCollection.find({}).toArray()
    
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Employees fetch error:', error)
    // Return empty array on error
    return NextResponse.json([])
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
    
    const result = await employeesCollection.insertOne(employee)
    
    return NextResponse.json({ 
      message: 'Employee created successfully',
      employeeId: result.insertedId 
    })
  } catch (error) {
    console.error('Employee creation error:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}