import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const db = await connectDB()
    const businessTypes = await db.collection('business_types').find({}).toArray()
    
    return NextResponse.json(businessTypes.map(type => ({
      ...type,
      id: type._id.toString()
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch business types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    
    const businessType = {
      name: body.name,
      description: body.description,
      fields: body.fields,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('business_types').insertOne(businessType)
    
    return NextResponse.json({ ...businessType, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create business type' }, { status: 500 })
  }
}