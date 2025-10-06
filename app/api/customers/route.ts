import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'

export const GET = withFeatureAccess('customers')(async function() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    const customers = await customersCollection.find({}).sort({ orderCount: -1 }).toArray()
    
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      id: customer._id.toString()
    }))
    
    return NextResponse.json(formattedCustomers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
})

export const POST = withFeatureAccess('customers')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email, address } = body
    
    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    
    // Check if customer already exists
    const existingCustomer = await customersCollection.findOne({
      $or: [
        { phone: phone },
        { name: name, phone: phone }
      ]
    })
    
    if (existingCustomer) {
      // Increment order count
      await customersCollection.updateOne(
        { _id: existingCustomer._id },
        { 
          $inc: { orderCount: 1 },
          $set: { 
            lastOrderDate: new Date(),
            updatedAt: new Date()
          }
        }
      )
      
      return NextResponse.json({
        ...existingCustomer,
        id: existingCustomer._id.toString(),
        orderCount: existingCustomer.orderCount + 1
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
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
})