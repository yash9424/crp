import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
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

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    const leavesCollection = db.collection(`tenant_${session.user.tenantId}_leaves`)
    
    const employees = await employeesCollection.find({}).toArray()
    
    const salaryData = await Promise.all(employees.map(async (employee) => {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      
      const empId = employee.employeeId || employee._id.toString()
      console.log('Looking for leaves for employee:', empId, 'in period:', startDate, 'to', endDate)
      
      const leaves = await leavesCollection.find({
        $or: [
          { employeeId: empId },
          { employeeId: employee._id.toString() },
          { employeeId: employee.employeeId }
        ]
      }).toArray()
      
      console.log('All leaves found for employee:', employee.employeeId, leaves)
      
      let leaveDays = 0
      if (leaves && leaves.length > 0) {
        leaves.forEach(leave => {
          if (leave.startDate && leave.endDate) {
            const leaveStartDate = new Date(leave.startDate)
            const leaveEndDate = new Date(leave.endDate)
            const monthStart = new Date(startDate)
            const monthEnd = new Date(endDate)
            
            // Check if leave overlaps with the month
            if (leaveStartDate <= monthEnd && leaveEndDate >= monthStart) {
              const overlapStart = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
              const overlapEnd = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
              const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
              leaveDays += Math.max(0, days)
              console.log('Leave overlap days:', days, 'for leave:', leave)
            }
          }
        })
      }
      
      console.log('Total leave days calculated:', leaveDays, 'for employee:', employee.employeeId)
      
      const workingDays = Math.max(0, 30 - leaveDays)
      const baseSalary = employee.salary || 0
      const dailySalary = baseSalary / 30
      const effectiveSalary = Math.round(dailySalary * workingDays)
      
      return {
        employeeId: employee.employeeId || employee._id.toString(),
        employeeName: employee.name || 'Unknown',
        baseSalary,
        workingDays,
        leaveDays,
        effectiveSalary
      }
    }))
    
    return NextResponse.json(salaryData)
  } catch (error) {
    console.error('Salary calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 })
  }
}