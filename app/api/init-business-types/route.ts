import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { defaultBusinessTypes } from '@/lib/default-business-types'

export async function POST() {
  try {
    const db = await connectDB()
    const businessTypesCollection = db.collection('business_types')
    
    // Check if business types already exist
    const existingCount = await businessTypesCollection.countDocuments()
    
    if (existingCount === 0) {
      // Insert default business types
      const businessTypesToInsert = defaultBusinessTypes.map(type => ({
        ...type,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      await businessTypesCollection.insertMany(businessTypesToInsert)
      
      return NextResponse.json({ 
        message: 'Default business types initialized successfully',
        count: businessTypesToInsert.length 
      })
    } else {
      return NextResponse.json({ 
        message: 'Business types already exist',
        count: existingCount 
      })
    }
  } catch (error) {
    console.error('Failed to initialize business types:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize business types' 
    }, { status: 500 })
  }
}