import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    
    await employeesCollection.updateMany(
      {},
      { $set: { commissionType: 'none', commissionRate: 0 } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear error:', error)
    return NextResponse.json({ error: 'Failed to clear commission data' }, { status: 500 })
  }
}
