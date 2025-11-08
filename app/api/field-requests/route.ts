import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    
    const fieldRequest = {
      tenantId: session.user.tenantId,
      tenantName: session.user.storeName || 'Unknown Store',
      fieldName: body.fieldName,
      fieldType: body.fieldType,
      description: body.description || '',
      businessType: body.businessType,
      status: 'pending',
      createdAt: new Date()
    }

    await db.collection('field_requests').insertOne(fieldRequest)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create field request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const requests = await db.collection('field_requests').find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json(requests.map(req => ({
      ...req,
      id: req._id.toString()
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch field requests' }, { status: 500 })
  }
}