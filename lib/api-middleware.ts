import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasFeatureAccess } from '@/lib/access-control'
import { FeatureKey } from '@/lib/feature-permissions'

export function withFeatureAccess(requiredFeature: FeatureKey) {
  return function middleware(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return async function (req: NextRequest, ...args: any[]) {
      try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.tenantId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const hasAccess = await hasFeatureAccess(session.user.tenantId, requiredFeature)
        
        if (!hasAccess) {
          return NextResponse.json({ 
            error: `Access denied: ${requiredFeature} feature not available in your plan` 
          }, { status: 403 })
        }
        
        return handler(req, ...args)
      } catch (error) {
        console.error('Feature access middleware error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  }
}