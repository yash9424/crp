import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const db = await connectDB()
    const tutorials = await db.collection('tutorials')
      .find({ status: 'active' })
      .sort({ order: 1, createdAt: -1 })
      .toArray()
    
    return NextResponse.json(tutorials)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tutorials' }, { status: 500 })
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
    
    const tutorial = {
      title: body.title,
      description: body.description,
      videoUrl: body.videoUrl,
      category: body.category,
      duration: body.duration,
      order: body.order || 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('tutorials').insertOne(tutorial)
    
    return NextResponse.json({ 
      message: 'Tutorial added successfully',
      id: result.insertedId 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add tutorial' }, { status: 500 })
  }
}