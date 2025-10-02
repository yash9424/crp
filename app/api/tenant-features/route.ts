import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantFeatures } from '@/lib/access-control'

// GET - Get tenant's allowed features
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
    console.log('Returning features:', allowedFeatures)
    
    return NextResponse.json({ allowedFeatures })
  } catch (error) {
    console.error('Error fetching tenant features:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}