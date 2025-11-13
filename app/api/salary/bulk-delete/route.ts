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

    const { employeeIds } = await request.json()
    
    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    
    await employeesCollection.deleteMany(
      { employeeId: { $in: employeeIds } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salary records' }, { status: 500 })
  }
}
