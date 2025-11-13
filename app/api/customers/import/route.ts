import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    const dataLines = lines.slice(1)
    const db = await connectDB()
    const customersCollection = db.collection(`customers_${session.user.tenantId}`)

    let imported = 0
    for (const line of dataLines) {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || []
      
      if (values.length < 1 || !values[0]) continue

      const customerData = {
        name: values[0],
        phone: values[1] || null,
        email: values[2] || null,
        address: values[3] || null,
        orderCount: parseInt(values[4]) || 0,
        totalSpent: parseFloat(values[5]) || 0,
        lastOrderDate: values[6] ? new Date(values[6]) : null,
        tenantId: session.user.tenantId,
        createdAt: values[7] ? new Date(values[7]) : new Date(),
        updatedAt: new Date()
      }

      await customersCollection.insertOne(customerData)
      imported++
    }

    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import customers' }, { status: 500 })
  }
}
