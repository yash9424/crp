import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
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
    
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim())
      if (!values || values.length < 7) continue

      const [employeeName, leaveType, startDate, endDate, days, reason, status] = values
      
      const employee = await employeesCollection.findOne({ name: employeeName })
      const employeeId = employee?.employeeId || employee?._id?.toString() || ''
      
      await leavesCollection.insertOne({
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        days: parseInt(days) || 0,
        reason,
        status,
        tenantId: session.user.tenantId,
        createdAt: new Date()
      })
      imported++
    }

    return NextResponse.json({ imported })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import leaves' }, { status: 500 })
  }
}
