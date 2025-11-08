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
    const employeeId = searchParams.get('employeeId')
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || '2024')

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    const db = await connectDB()
    const employeesCollection = db.collection(`employees_${session.user.tenantId}`)
    const settingsCollection = db.collection(`settings_${session.user.tenantId}`)
    
    const employee = await employeesCollection.findOne({ employeeId })
    const settings = await settingsCollection.findOne({})
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Real-time salary calculation matching the salary page
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    
    const leavesCollection = db.collection(`tenant_${session.user.tenantId}_leaves`)
    const empId = employee.employeeId || employee._id.toString()
    
    const leaves = await leavesCollection.find({
      $or: [
        { employeeId: empId },
        { employeeId: employee._id.toString() },
        { employeeId: employee.employeeId }
      ]
    }).toArray()
    
    let leaveDays = 0
    if (leaves && leaves.length > 0) {
      leaves.forEach(leave => {
        if (leave.startDate && leave.endDate) {
          const leaveStartDate = new Date(leave.startDate)
          const leaveEndDate = new Date(leave.endDate)
          const monthStart = new Date(startDate)
          const monthEnd = new Date(endDate)
          
          if (leaveStartDate <= monthEnd && leaveEndDate >= monthStart) {
            const overlapStart = new Date(Math.max(leaveStartDate.getTime(), monthStart.getTime()))
            const overlapEnd = new Date(Math.min(leaveEndDate.getTime(), monthEnd.getTime()))
            const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
            leaveDays += Math.max(0, days)
          }
        }
      })
    }
    
    const workingDays = Math.max(0, 30 - leaveDays)
    const baseSalary = employee.salary || 0
    const dailySalary = baseSalary / 30
    const effectiveSalary = Math.round(dailySalary * workingDays)
    const deduction = baseSalary - effectiveSalary

    // Generate PDF content
    const pdfContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; }
            .title { font-size: 18px; margin: 10px 0; }
            .details { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 2px solid #000; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">Company Name</div>
            <div class="title">Salary Slip</div>
            <div>Month: ${new Date(0, month - 1).toLocaleString('default', { month: 'long' })} ${year}</div>
          </div>
          
          <div class="details">
            <div class="row"><span>Employee Name:</span><span>${employee.name}</span></div>
            <div class="row"><span>Employee ID:</span><span>${employee.employeeId}</span></div>
            <div class="row"><span>Department:</span><span>${employee.department || 'N/A'}</span></div>
            <div class="row"><span>Position:</span><span>${employee.position || 'N/A'}</span></div>
          </div>
          
          <div class="details">
            <div class="row"><span>Base Salary:</span><span>₹ ${employee.salary.toLocaleString()}</span></div>
            <div class="row"><span>Working Days:</span><span>${workingDays}</span></div>
            <div class="row"><span>Leave Days:</span><span>${leaveDays}</span></div>
            <div class="row"><span>Daily Rate:</span><span>₹ ${dailySalary.toFixed(2)}</span></div>
            <div class="row"><span>Leave Deduction:</span><span>₹ ${deduction.toLocaleString()}</span></div>
            <div class="row total"><span>Net Salary:</span><span>₹ ${effectiveSalary.toLocaleString()}</span></div>
          </div>
          
          <div style="margin-top: 50px; text-align: center;">
            <p>This is a computer-generated salary slip.</p>
          </div>
        </body>
      </html>
    `

    // Return JSON data for PDF generation
    const salarySlipData = {
      employeeName: employee.name,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      baseSalary: employee.salary,
      workingDays,
      leaveDays,
      dailySalary,
      deduction,
      effectiveSalary,
      month,
      year,
      storeName: settings?.storeName || 'Your Store Name',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
      gst: settings?.gst || ''
    }

    return NextResponse.json(salarySlipData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate salary slip' }, { status: 500 })
  }
}