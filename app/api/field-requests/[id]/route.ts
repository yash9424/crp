import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    
    let query
    try {
      query = { _id: new ObjectId(params.id) }
    } catch {
      query = { _id: params.id }
    }
    
    // Get the field request details
    const fieldRequest = await db.collection('field_requests').findOne(query)
    
    if (!fieldRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    
    // Update request status
    await db.collection('field_requests').updateOne(
      query,
      { 
        $set: { 
          status: body.status,
          updatedAt: new Date()
        }
      }
    )
    
    // If approved, add field to business type template
    if (body.status === 'approved' && fieldRequest.businessType && fieldRequest.businessType !== 'none') {
      let businessTypeQuery
      try {
        businessTypeQuery = { _id: new ObjectId(fieldRequest.businessType) }
      } catch {
        businessTypeQuery = { _id: fieldRequest.businessType }
      }
      
      const newField = {
        name: fieldRequest.fieldName,
        type: fieldRequest.fieldType,
        required: false,
        options: fieldRequest.fieldType === 'select' ? [] : undefined
      }
      
      await db.collection('business_types').updateOne(
        businessTypeQuery,
        { 
          $push: { fields: newField },
          $set: { updatedAt: new Date() }
        }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}