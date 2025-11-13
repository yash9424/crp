import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
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
    
    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    
    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim())
      if (!values || values.length < 3) continue

      const [employeeId, employeeName, baseSalary] = values
      
      const result = await employeesCollection.updateOne(
        { employeeId },
        { 
          $set: { 
            name: employeeName,
            salary: parseFloat(baseSalary) || 0,
            updatedAt: new Date()
          },
          $setOnInsert: {
            employeeId,
            tenantId: session.user.tenantId,
            department: 'General',
            position: 'Staff',
            status: 'Active',
            commissionType: 'none',
            commissionRate: 0,
            createdAt: new Date()
          }
        },
        { upsert: true }
      )
      if (result.upsertedCount > 0 || result.modifiedCount > 0) imported++
    }

    return NextResponse.json({ imported })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import salary data' }, { status: 500 })
  }
}
