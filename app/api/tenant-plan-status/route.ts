import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Check current tenant's plan status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    
    // Get tenant data
    const tenant = await tenantsCollection.findOne({ 
      _id: new ObjectId(session.user.tenantId) 
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    // If no plan expiry date, don't show notification
    if (!tenant.planExpiryDate) {
      return NextResponse.json({ showNotification: false })
    }
    
    const now = new Date()
    const expiryDate = new Date(tenant.planExpiryDate)
    const timeDiff = expiryDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    
    const planStatus = {
      planName: tenant.planName || 'Test Plan',
      expiryDate: tenant.planExpiryDate,
      daysLeft: Math.max(0, daysLeft),
      isExpired: daysLeft <= 0,
      isExpiringSoon: daysLeft > 0 && daysLeft <= 30,
      showNotification: daysLeft <= 30
    }
    
    return NextResponse.json(planStatus)
  } catch (error) {
    console.error('Plan status check error:', error)
    return NextResponse.json({ showNotification: false })
  }
}