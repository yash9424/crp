import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Fetch all plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const session = await getServerSession(authOptions)
    const db = await connectDB()
    const plansCollection = db.collection('plans')
    const tenantsCollection = db.collection('tenants')
    
    // Show only active plans for tenant users, all plans for super-admin
    const filter = session?.user?.role === 'super-admin' ? {} : { status: 'active' }
    const total = await plansCollection.countDocuments(filter)
    const plans = await plansCollection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    
    // Add subscriber count for each plan
    const plansWithSubscribers = await Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await tenantsCollection.countDocuments({ plan: plan._id })
        return {
          ...plan,
          id: plan._id.toString(),
          subscribers: subscriberCount
        }
      })
    )
    
    return NextResponse.json({
      data: plansWithSubscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST - Create new plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, features, maxUsers, maxProducts, description, allowedFeatures, durationDays } = body

    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const plan = {
      name,
      price: Number(price),
      features: features || [],
      maxUsers: Number(maxUsers),
      maxProducts: Number(maxProducts),
      description: description || '',
      allowedFeatures: allowedFeatures || ['dashboard'],
      durationDays: Number(durationDays) || 365,
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