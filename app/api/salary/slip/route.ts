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
    const employeeId = searchParams.get('employeeId')
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || '2024')

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    
    const employee = await employeesCollection.findOne({ employeeId, tenantId: session.user.tenantId })
    const settings = await settingsCollection.findOne({ tenantId: session.user.tenantId })
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Calculate salary data
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
    
    let leaveDays = 0
    leaves.forEach(leave => {
      const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), new Date(startDate).getTime()))
      const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), new Date(endDate).getTime()))
      leaveDays += Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    })
    
    const workingDays = 30 - leaveDays
    const dailySalary = employee.salary / 30
    const effectiveSalary = Math.round(dailySalary * workingDays)
    const deduction = employee.salary - effectiveSalary

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