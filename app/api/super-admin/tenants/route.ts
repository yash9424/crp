import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    
    const count = await db.collection('tenants').countDocuments()
    
    if (count === 0) {
      const sampleTenants = [
        { name: "Fashion Store Ltd", email: "admin@fashionstore.com" },
        { name: "Style Boutique", email: "contact@styleboutique.com" },
        { name: "Trendy Clothes Co", email: "info@trendyclothes.com" }
      ]
      await db.collection('tenants').insertMany(sampleTenants)
      return NextResponse.json(sampleTenants)
    }
    
    const tenants = await db.collection('tenants').find({}, { projection: { name: 1, email: 1 } }).toArray()
    return NextResponse.json(tenants)
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}