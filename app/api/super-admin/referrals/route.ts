import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    
    const referrals = await db.collection('referrals').find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json(referrals)
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    const body = await request.json()
    
    const { referrerShop, referredShop, referredEmail, referralCode, planType } = body
    
    if (!referrerShop || !referredShop || !referralCode || !planType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const reward = planType === "Enterprise" ? 499 : planType === "Professional" ? 299 : 199

    const newReferral = {
      referrerShop,
      referralCode,
      referredShop,
      referredEmail: referredEmail || "",
      planType,
      reward,
      status: "Pending",
      dateReferred: new Date().toISOString().split('T')[0],
      dateCompleted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('referrals').insertOne(newReferral)
    return NextResponse.json({ ...newReferral, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    const body = await request.json()
    const { id, status } = body

    await db.collection('referrals').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          dateCompleted: status === "Completed" ? new Date().toISOString().split('T')[0] : null,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ message: 'Referral updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await db.collection('referrals').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ message: 'Referral deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete referral' }, { status: 500 })
  }
}