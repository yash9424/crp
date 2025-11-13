import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    const employees = await employeesCollection.find({}).sort({ createdAt: -1 }).toArray()

    const csv = [
      'Name,Employee ID,Email,Phone,Salary,Join Date,Address,Emergency Contact,Status',
      ...employees.map(e => 
        `"${e.name}","${e.employeeId}","${e.email || ''}","${e.phone || ''}",${e.salary || 0},"${e.joinDate || ''}","${e.address || ''}","${e.emergencyContact || ''}","${e.status || 'Active'}"`
      )
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="employees_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export employees' }, { status: 500 })
  }
}
