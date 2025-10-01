import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// PUT - Update plan
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, price, features, maxUsers, maxProducts, description, status } = body

    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const updateData = {
      name,
      price: Number(price),
      features,
      maxUsers: Number(maxUsers),
      maxProducts: Number(maxProducts),
      description,
      status: status || 'active',
      updatedAt: new Date()
    }

    await plansCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    const updatedPlan = await plansCollection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({ ...updatedPlan, id: updatedPlan?._id.toString() })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    await plansCollection.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}