import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    
    // Get alert logs for this tenant
    const alertLogs = await db.collection('alert_logs')
      .find({ tenantId: session.user.tenantId })
      .sort({ sentAt: -1 })
      .limit(50)
      .toArray()
    
    return NextResponse.json(alertLogs)
    
  } catch (error) {
    console.error('Alert logs error:', error)
    return NextResponse.json({ error: 'Failed to fetch alert logs' }, { status: 500 })
  }
}