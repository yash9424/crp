import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    
    await employeesCollection.deleteMany({})
    
    return NextResponse.json({ message: 'All employees deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear employees' }, { status: 500 })
  }
}
