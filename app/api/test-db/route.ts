import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test session
    const session = await getServerSession(authOptions)
    console.log('Session test:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      tenantId: session?.user?.tenantId,
      role: session?.user?.role
    })
    
    // Test database connection
    const db = await connectDB()
    console.log('Database connected successfully')
    
    // Test collection access
    if (session?.user?.tenantId) {
      const collectionName = `products_${session.user.tenantId}`
      const collection = db.collection(collectionName)
      const count = await collection.countDocuments()
      console.log(`Collection ${collectionName} has ${count} documents`)
      
      return NextResponse.json({
        success: true,
        session: {
          hasSession: !!session,
          tenantId: session.user.tenantId,
          role: session.user.role
        },
        database: {
          connected: true,
          collection: collectionName,
          documentCount: count
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No tenant ID in session',
        session: {
          hasSession: !!session,
          tenantId: session?.user?.tenantId,
          role: session?.user?.role
        }
      })
    }
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}