import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const tenantFields = await db.collection('tenant_fields').findOne({ 
      tenantId: params.tenantId 
    })
    
    return NextResponse.json(tenantFields || { fields: [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tenant fields' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    
    const tenantFieldConfig = {
      tenantId: params.tenantId,
      businessType: 'admin-assigned',
      fields: body.fields || [],
      updatedAt: new Date(),
      assignedBy: session.user.id
    }

    await db.collection('tenant_fields').updateOne(
      { tenantId: params.tenantId },
      { $set: tenantFieldConfig },
      { upsert: true }
    )
    
    return NextResponse.json({ message: 'Fields assigned successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign fields' }, { status: 500 })
  }
}