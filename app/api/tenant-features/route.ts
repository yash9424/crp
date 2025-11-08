import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantFeatures } from '@/lib/access-control'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// GET - Get tenant's allowed features and business type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session in tenant-features API:', session)
    
    if (!session?.user?.tenantId) {
      console.log('No tenantId in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Getting features for tenantId:', session.user.tenantId)
    const allowedFeatures = await getTenantFeatures(session.user.tenantId)
    
    // Get tenant's business type
    const db = await connectDB()
    let tenantQuery
    try {
      tenantQuery = { _id: new ObjectId(session.user.tenantId) }
    } catch {
      tenantQuery = { _id: session.user.tenantId }
    }
    
    const tenant = await db.collection('tenants').findOne(tenantQuery)
    const businessType = tenant?.businessType || 'none'
    
    console.log('Returning features and business type:', { allowedFeatures, businessType })
    
    return NextResponse.json({ allowedFeatures, businessType })
  } catch (error) {
    console.error('Error fetching tenant features:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}