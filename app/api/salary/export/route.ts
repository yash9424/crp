import { NextResponse } from 'next/server'
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
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    const employees = await employeesCollection.find({}).sort({ createdAt: -1 }).toArray()

    const csv = [
      'Employee ID,Employee Name,Base Salary,Working Days,Leave Days,Effective Salary',
      ...employees.map(e => 
        `"${e.employeeId || e._id}","${e.name}",${e.salary || 0},30,0,${e.salary || 0}`
      )
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="salary_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export salary data' }, { status: 500 })
  }
}
