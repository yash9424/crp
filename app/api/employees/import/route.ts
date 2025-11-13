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
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)

    let imported = 0
    for (const line of dataLines) {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || []
      
      if (values.length < 2 || !values[0]) continue

      const employeeData = {
        name: values[0],
        employeeId: values[1],
        email: values[2] || null,
        phone: values[3] || null,
        salary: parseFloat(values[4]) || 0,
        joinDate: values[5] || null,
        address: values[6] || null,
        emergencyContact: values[7] || null,
        status: values[8] || 'Active',
        department: 'General',
        position: 'Staff',
        tenantId: session.user.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await employeesCollection.insertOne(employeeData)
      imported++
    }

    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import employees' }, { status: 500 })
  }
}
