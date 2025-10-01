import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || '2024')

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    const employees = await employeesCollection.find({ tenantId: session.user.tenantId }).toArray()
    
    const salaryData = await Promise.all(employees.map(async (employee) => {
      // Get leaves for the month
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      
      const leaves = await leavesCollection.find({
        employeeId: employee._id.toString(),
        status: 'Approved',
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      }).toArray()
      
      // Calculate leave days in the month
      let leaveDays = 0
      leaves.forEach(leave => {
        const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), new Date(startDate).getTime()))
        const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), new Date(endDate).getTime()))
        leaveDays += Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      })
      
      const workingDays = 30 - leaveDays
      const dailySalary = employee.salary / 30
      const effectiveSalary = Math.round(dailySalary * workingDays)
      
      return {
        employeeId: employee.employeeId,
        employeeName: employee.name,
        baseSalary: employee.salary,
        workingDays,
        leaveDays,
        effectiveSalary
      }
    }))
    
    return NextResponse.json(salaryData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 })
  }
}