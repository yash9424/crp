import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fieldSettingsPassword } = await request.json()
    
    if (!fieldSettingsPassword) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const db = await connectDB()
    
    // Update field settings password for all tenants
    const collections = await db.listCollections({ name: /^settings_/ }).toArray()
    
    for (const collection of collections) {
      await db.collection(collection.name).updateMany(
        {},
        { 
          $set: { 
            fieldSettingsPassword,
            updatedAt: new Date()
          }
        }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated field settings password for ${collections.length} tenants` 
    })
  } catch (error) {
    console.error('Super admin settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}