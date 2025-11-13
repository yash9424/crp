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
    const customersCollection = db.collection(`customers_${session.user.tenantId}`)
    
    await customersCollection.deleteMany({})
    
    return NextResponse.json({ message: 'All customers deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear customers' }, { status: 500 })
  }
}
