import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const customersCollection = db.collection(`customers_${session.user.tenantId}`)
    const customers = await customersCollection.find({}).sort({ createdAt: -1 }).toArray()

    const csv = [
      'Name,Phone,Email,Address,Order Count,Total Spent,Last Order Date,Created At',
      ...customers.map(c => 
        `"${c.name}","${c.phone || ''}","${c.email || ''}","${c.address || ''}",${c.orderCount || 0},${c.totalSpent || 0},"${c.lastOrderDate ? new Date(c.lastOrderDate).toISOString() : ''}","${new Date(c.createdAt).toISOString()}"`
      )
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 })
  }
}
