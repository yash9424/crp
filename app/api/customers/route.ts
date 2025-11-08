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
    const customersCollection = db.collection(`customers_${session.user.tenantId}`)
    const customers = await customersCollection.find({}).sort({ orderCount: -1 }).toArray()
    
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      id: customer._id.toString()
    }))
    
    return NextResponse.json(formattedCustomers)
  } catch (error) {
    console.error('Customers fetch error:', error)
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
    const { name, phone, email, address } = body
    
    const db = await connectDB()
    const customersCollection = db.collection(`customers_${session.user.tenantId}`)
    
    // Check if customer already exists
    const existingCustomer = await customersCollection.findOne({
      $or: [
        { phone: phone },
        { name: name, phone: phone }
      ]
    })
    
    if (existingCustomer) {
      return NextResponse.json({
        ...existingCustomer,
        id: existingCustomer._id.toString()
      })
    }
    
    // Create new customer
    const customer = {
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      orderCount: body.orderCount || 0,
      totalSpent: 0,
      lastOrderDate: body.orderCount > 0 ? new Date() : null,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await customersCollection.insertOne(customer)
    
    return NextResponse.json({ 
      ...customer, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    console.error('Customer creation error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}