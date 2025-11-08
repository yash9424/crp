import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const dropdownCollection = db.collection(`dropdown_data_${session.user.tenantId}`)
    const dropdownData = await dropdownCollection.findOne({ type: 'master-data' })
    
    if (!dropdownData) {
      const defaultData = {
        type: 'master-data',
        categories: ['T-Shirts', 'Jeans', 'Shirts', 'Dresses', 'Jackets', 'Accessories', 'Sarees', 'Kurtis', 'Anarkali'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
        colors: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Orange', 'Brown'],
        materials: ['Cotton', 'Silk', 'Polyester', 'Linen', 'Wool', 'Denim', 'Chiffon', 'Georgette'],
        brands: ['Zara', 'H&M', 'Uniqlo', 'Forever 21', 'Mango', 'Biba', 'W', 'Aurelia'],
        suppliers: ['Fashion Hub Pvt Ltd', 'Style Mart Suppliers', 'Trendy Textiles', 'Elite Fashion House'],
        tenantId: session.user.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await dropdownCollection.insertOne(defaultData)
      return NextResponse.json(defaultData)
    }
    
    return NextResponse.json(dropdownData)
  } catch (error) {
    console.error('Dropdown data error:', error)
    return NextResponse.json({ error: 'Failed to fetch dropdown data' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    const dropdownCollection = db.collection(`dropdown_data_${session.user.tenantId}`)
    
    await dropdownCollection.updateOne(
      { type: 'master-data', tenantId: session.user.tenantId },
      { 
        $set: { 
          ...body,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({ message: 'Dropdown data updated successfully' })
  } catch (error) {
    console.error('Dropdown update error:', error)
    return NextResponse.json({ error: 'Failed to update dropdown data' }, { status: 500 })
  }
}