import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// POST - Upgrade tenant plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only super-admin can update plans
    if (!session?.user || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { planId, tenantId } = await request.json()
    
    if (!planId || !tenantId) {
      return NextResponse.json({ error: 'Plan ID and Tenant ID required' }, { status: 400 })
    }
    
    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    
    // Verify plan exists
    const plan = await plansCollection.findOne({ _id: new ObjectId(planId) })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    
    // Update tenant's plan
    const result = await tenantsCollection.updateOne(
      { _id: new ObjectId(tenantId) },
      { 
        $set: { 
          plan: new ObjectId(planId),
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Plan updated successfully',
      planName: plan.name,
      features: plan.allowedFeatures?.length || 0
    })
    
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}