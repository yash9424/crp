import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// GET - Fetch all plans
export async function GET() {
  try {
    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const plans = await plansCollection.find({}).sort({ createdAt: -1 }).toArray()
    
    const plansWithId = plans.map(plan => ({
      ...plan,
      id: plan._id.toString()
    }))
    
    return NextResponse.json(plansWithId)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST - Create new plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, features, maxUsers, maxProducts, description } = body

    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const plan = {
      name,
      price: Number(price),
      features: features || [],
      maxUsers: Number(maxUsers),
      maxProducts: Number(maxProducts),
      description: description || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await plansCollection.insertOne(plan)
    const newPlan = { ...plan, id: result.insertedId.toString() }

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}