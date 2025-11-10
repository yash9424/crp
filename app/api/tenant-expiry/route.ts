import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Check tenant expiry status and notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    
    const now = new Date()
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    
    // Get all tenants for super admin, or current tenant for regular users
    let query: any = {}
    
    if (session?.user?.role !== 'super_admin' && session?.user?.tenantId) {
      query._id = session.user.tenantId
    }
    
    const tenants = await tenantsCollection.find(query).toArray()
    
    const expiringTenants = []
    const expiredTenants = []
    
    for (const tenant of tenants) {
      // Skip if no expiry date
      if (!tenant.planExpiryDate) continue
      
      const expiryDate = new Date(tenant.planExpiryDate)
      
      if (expiryDate <= now) {
        expiredTenants.push({
          ...tenant,
          daysOverdue: Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))
        })
      } else if (expiryDate <= tenDaysFromNow) {
        expiringTenants.push({
          ...tenant,
          daysLeft: Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        })
      }
    }
    
    return NextResponse.json({
      expiringTenants,
      expiredTenants,
      totalTenants: tenants.length,
      debug: {
        totalFound: tenants.length,
        withExpiryDate: tenants.filter(t => t.planExpiryDate).length,
        currentTime: now.toISOString(),
        tenDaysFromNow: tenDaysFromNow.toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check tenant expiry' }, { status: 500 })
  }
}

// POST - Auto-deactivate expired tenants (super admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    
    const now = new Date()
    
    // Find and deactivate expired tenants
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
          deactivationReason: 'Plan expired'
        }
      }
    )
    
    return NextResponse.json({
      message: `${result.modifiedCount} tenants deactivated due to plan expiry`,
      deactivatedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('Tenant deactivation error:', error)
    return NextResponse.json({ error: 'Failed to deactivate expired tenants' }, { status: 500 })
  }
}