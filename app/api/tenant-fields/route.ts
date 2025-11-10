import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    console.log('Fetching tenant fields...')
    const session = await getServerSession(authOptions)
    console.log('Session tenant ID:', session?.user?.tenantId)
    
    if (!session?.user?.tenantId) {
      console.log('No tenant ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Connecting to database...')
    const db = await connectDB()
    console.log('Database connected, fetching tenant fields...')
    
    const tenantFields = await db.collection('tenant_fields').findOne({ 
      tenantId: session.user.tenantId 
    })
    
    console.log('Tenant fields found:', tenantFields ? 'Yes' : 'No')
    
    return NextResponse.json(tenantFields || { fields: [] })
  } catch (error) {
    console.error('Tenant fields fetch error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    // Return empty fields instead of error to prevent page crash
    return NextResponse.json({ fields: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Saving tenant fields...')
    const session = await getServerSession(authOptions)
    console.log('Session tenant ID:', session?.user?.tenantId)
    
    if (!session?.user?.tenantId) {
      console.log('No tenant ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const db = await connectDB()
    console.log('Database connected')
    
    const tenantFieldConfig = {
      tenantId: session.user.tenantId,
      businessType: body.businessType || 'default',
      fields: body.fields || [],
      updatedAt: new Date()
    }
    
    console.log('Saving config:', tenantFieldConfig)

    const result = await db.collection('tenant_fields').updateOne(
      { tenantId: session.user.tenantId },
      { $set: tenantFieldConfig },
      { upsert: true }
    )
    
    console.log('Save result:', result)
    
    return NextResponse.json(tenantFieldConfig)
  } catch (error) {
    console.error('Tenant fields save error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      error: 'Failed to save tenant fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}