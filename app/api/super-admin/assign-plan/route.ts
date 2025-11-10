import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId, planName, durationDays } = await request.json()
    
    if (!tenantId || !planName || !durationDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    
    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays))
    
    // Update tenant with new plan
    const result = await tenantsCollection.updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          planName,
          planExpiryDate: expiryDate,
          planDuration: parseInt(durationDays),
          status: 'active',
          planAssignedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      message: 'Plan assigned successfully',
      planName,
      expiryDate: expiryDate.toISOString(),
      durationDays: parseInt(durationDays)
    })
  } catch (error) {
    console.error('Plan assignment error:', error)
    return NextResponse.json({ error: 'Failed to assign plan' }, { status: 500 })
  }
}