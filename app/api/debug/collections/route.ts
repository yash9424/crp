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
    const collections = await db.listCollections().toArray()
    
    const tenantId = session.user.tenantId
    const relevantCollections = collections.filter(col => 
      col.name.includes(tenantId) || 
      col.name.includes('products') || 
      col.name.includes('inventory')
    )

    const result = []
    for (const col of relevantCollections) {
      const count = await db.collection(col.name).countDocuments()
      result.push({
        name: col.name,
        count: count
      })
    }

    return NextResponse.json({
      tenantId,
      allCollections: collections.map(c => c.name),
      relevantCollections: result
    })
  } catch (error) {
    console.error('Debug collections error:', error)
    return NextResponse.json({ error: 'Failed to get collections' }, { status: 500 })
  }
}