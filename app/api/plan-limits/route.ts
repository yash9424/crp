import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantPlanLimits } from '@/lib/plan-limits'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limits = await getTenantPlanLimits(session.user.tenantId)
    
    if (!limits) {
      return NextResponse.json({ 
        maxProducts: 999999,
        maxUsers: 999999,
        currentProducts: 0,
        currentUsers: 0,
        planName: 'No Plan'
      })
    }

    return NextResponse.json(limits)
  } catch (error) {
    console.error('Failed to fetch plan limits:', error)
    return NextResponse.json({ error: 'Failed to fetch plan limits' }, { status: 500 })
  }
}