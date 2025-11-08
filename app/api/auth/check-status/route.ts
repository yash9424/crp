import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const db = await connectDB()
    const tenantsCollection = db.collection('tenants')
    
    const tenant = await tenantsCollection.findOne({ email })
    
    if (!tenant) {
      return NextResponse.json({ blocked: false })
    }
    
    const isValidPassword = await bcrypt.compare(password, tenant.password)
    if (!isValidPassword) {
      return NextResponse.json({ blocked: false })
    }
    
    // Valid credentials but check status
    if (tenant.status !== 'active') {
      return NextResponse.json({ blocked: true })
    }
    
    return NextResponse.json({ blocked: false })
  } catch (error) {
    return NextResponse.json({ blocked: false })
  }
}