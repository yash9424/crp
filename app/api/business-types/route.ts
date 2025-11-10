import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const db = await connectDB()
    const collection = db.collection('business_types')
    
    // Check if collection exists and has documents
    const total = await collection.countDocuments({})
    const businessTypes = total > 0 
      ? await collection.find({}).skip(skip).limit(limit).toArray()
      : []
    
    const formattedTypes = businessTypes.map(type => ({
      ...type,
      id: type._id.toString()
    }))
    
    return NextResponse.json({
      data: formattedTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Business types fetch error:', error)
    return NextResponse.json({ 
      data: [], 
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } 
    })
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