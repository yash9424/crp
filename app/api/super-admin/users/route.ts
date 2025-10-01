import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    
    const count = await db.collection('admin_users').countDocuments()
    
    if (count === 0) {
      const sampleUsers = [
        {
          name: "Admin User 1",
          email: "admin1@clothingerp.com",
          phone: "+91 9876543210",
          role: "Super Admin",
          status: "Active",
          lastLogin: "2024-09-24 10:30 AM",
          createdAt: "2024-01-15",
          permissions: ["All Access"],
          password: "admin123"
        },
        {
          name: "Support Manager",
          email: "support@clothingerp.com",
          phone: "+91 9876543211",
          role: "Support Admin",
          status: "Active",
          lastLogin: "2024-09-24 09:15 AM",
          createdAt: "2024-02-20",
          permissions: ["Support", "Tickets", "Users"],
          password: "support123"
        }
      ]
      
      await db.collection('admin_users').insertMany(sampleUsers)
      return NextResponse.json(sampleUsers.map(u => ({ ...u, password: undefined })))
    }
    
    const users = await db.collection('admin_users').find({}, { projection: { password: 0 } }).toArray()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    const body = await request.json()
    
    const { name, email, phone, role, password } = body
    
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const permissions = role === "Super Admin" ? ["All Access"] : 
                      role === "Support Admin" ? ["Support", "Tickets", "Users"] :
                      role === "Billing Admin" ? ["Billing", "Plans", "Reports"] :
                      ["System", "Database", "Settings"]

    const newUser = {
      name,
      email,
      phone: phone || "",
      role,
      status: "Active",
      lastLogin: null,
      createdAt: new Date().toISOString().split('T')[0],
      permissions,
      password: password || "temp123",
      createdAtDate: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('admin_users').insertOne(newUser)
    const { password: _, ...userResponse } = newUser
    return NextResponse.json({ ...userResponse, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    delete updateData.password
    updateData.updatedAt = new Date()

    await db.collection('admin_users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
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

    await db.collection('admin_users').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}