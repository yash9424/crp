import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'

export async function GET() {
  try {
    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    
    const now = new Date()
    
    // Auto-deactivate expired tenants
    const result = await tenantsCollection.updateMany(
      {
        planExpiryDate: { $lt: now },
        $or: [
          { status: 'active' },
          { status: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'inactive',
          deactivatedAt: now,
          deactivationReason: 'Plan expired - auto deactivated'
        }
      }
    )
    
    return NextResponse.json({
      message: `Auto-deactivated ${result.modifiedCount} expired tenants`,
      deactivatedCount: result.modifiedCount,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Auto-deactivation error:', error)
    return NextResponse.json({ error: 'Failed to auto-deactivate tenants' }, { status: 500 })
  }
}