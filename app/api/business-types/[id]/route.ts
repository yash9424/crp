import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectDB()
    
    let query
    try {
      query = { _id: new ObjectId(params.id) }
    } catch {
      query = { _id: params.id }
    }
    
    const businessType = await db.collection('business_types').findOne(query)
    
    if (!businessType) {
      return NextResponse.json({ error: 'Business type not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      ...businessType,
      id: businessType._id.toString()
    })
  } catch (error) {
    console.error('Error fetching business type:', error)
    return NextResponse.json({ error: 'Failed to fetch business type' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectDB()
    const body = await request.json()
    
    let query
    try {
      query = { _id: new ObjectId(params.id) }
    } catch {
      query = { _id: params.id }
    }
    
    const updateData = {
      name: body.name,
      description: body.description,
      fields: body.fields,
      updatedAt: new Date()
    }
    
    const result = await db.collection('business_types').updateOne(
      query,
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Business type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Business type updated successfully' })
  } catch (error) {
    console.error('Error updating business type:', error)
    return NextResponse.json({ error: 'Failed to update business type' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectDB()
    
    let query
    try {
      query = { _id: new ObjectId(params.id) }
    } catch {
      query = { _id: params.id }
    }
    
    const result = await db.collection('business_types').deleteOne(query)
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Business type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Business type deleted successfully' })
  } catch (error) {
    console.error('Error deleting business type:', error)
    return NextResponse.json({ error: 'Failed to delete business type' }, { status: 500 })
  }
}