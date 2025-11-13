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
    console.log('Session in tenant-features API:', JSON.stringify(session, null, 2))
    
    if (!session?.user) {
      console.log('No user in session')
      return NextResponse.json({ 
        allowedFeatures: ['dashboard'],
        businessType: 'none'
      })
    }
    
    if (!session.user.tenantId) {
      console.log('No tenantId in session, user role:', session.user.role)
      return NextResponse.json({ 
        allowedFeatures: ['dashboard'],
        businessType: 'none'
      })
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
  } catch (error: any) {
    console.error('Error fetching tenant features:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json({ 
      error: 'Failed to fetch features',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}