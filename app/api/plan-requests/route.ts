import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, reason } = await request.json()
    const db = await connectDB()
    
    const planRequest = {
      tenantId: session.user.tenantId,
      requestedPlanId: planId,
      reason: reason || '',
      status: 'pending',
      requestedAt: new Date(),
      requestedBy: session.user.name
    }
    
    await db.collection('planRequests').insertOne(planRequest)
    
    return NextResponse.json({ message: 'Plan upgrade request submitted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = await connectDB()
    const requests = await db.collection('planRequests')
      .find({})
      .sort({ requestedAt: -1 })
      .toArray()
    
    return NextResponse.json(requests.map(req => ({
      ...req,
      id: req._id.toString()
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { requestId, status } = await request.json()
    const db = await connectDB()
    
    await db.collection('planRequests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({ message: 'Request status updated' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}