import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// GET - Fetch single plan
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const plan = await plansCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    
    const planWithId = { ...plan, id: plan._id.toString() }
    return NextResponse.json(planWithId)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

// PUT - Update plan
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, price, features, maxUsers, maxProducts, description, allowedFeatures, status } = body

    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = Number(price)
    if (features !== undefined) updateData.features = features
    if (maxUsers !== undefined) updateData.maxUsers = Number(maxUsers)
    if (maxProducts !== undefined) updateData.maxProducts = Number(maxProducts)
    if (description !== undefined) updateData.description = description
    if (allowedFeatures !== undefined) updateData.allowedFeatures = allowedFeatures
    if (status !== undefined) updateData.status = status

    const result = await plansCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Plan updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const result = await plansCollection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}