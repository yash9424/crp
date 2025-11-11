import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// POST - Assign plan to tenant with expiry date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, planId } = body

    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    
    // Get plan details
    const plan = await plansCollection.findOne({ _id: new ObjectId(planId) })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    
    // Calculate expiry date based on plan duration
    const now = new Date()
    const expiryDate = new Date(now.getTime() + (plan.durationDays || 365) * 24 * 60 * 60 * 1000)
    
    // Update tenant with plan and expiry date
    const result = await tenantsCollection.updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          plan: new ObjectId(planId),
          planName: plan.name,
          planExpiryDate: expiryDate,
          planAssignedAt: now,
          status: 'active',
          updatedAt: now
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      message: 'Plan assigned successfully',
      expiryDate: expiryDate.toISOString(),
      durationDays: plan.durationDays || 365
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign plan' }, { status: 500 })
  }
}