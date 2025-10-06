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
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    
    // Get employees with commission setup
    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const employees = await employeesCollection.find({
      $and: [
        { commissionType: { $exists: true } },
        { commissionType: { $ne: 'none' } },
        { commissionType: { $ne: null } }
      ]
    }).toArray()

    // Get sales data for the month
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const startDate = new Date(month + '-01')
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
    
    const sales = await salesCollection.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray()

    // Calculate commissions for each employee
    const commissionData = employees.map(employee => {
      // Get sales made by this employee
      const employeeSales = sales.filter(sale => {
        const staffMember = (sale.staffMember || '').toLowerCase()
        const cashier = (sale.cashier || '').toLowerCase()
        const employeeName = (employee.name || '').toLowerCase()
        const employeeId = (employee.employeeId || '').toLowerCase()
        
        return staffMember === employeeId ||
               staffMember === employeeName ||
               cashier === employeeName || 
               cashier === employeeId
      })

      const totalSales = employeeSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      const salesCount = employeeSales.length
      const salesTarget = employee.salesTarget || 0
      const targetAchieved = salesTarget > 0 ? Math.round((totalSales / salesTarget) * 100) : 0

      let commissionEarned = 0

      // Calculate commission based on type (percentage only)
      if (employee.commissionType === 'percentage') {
        commissionEarned = (totalSales * (employee.commissionRate || 0)) / 100
      } else {
        commissionEarned = 0
      }

      return {
        employeeId: employee.employeeId,
        employeeName: employee.name,
        totalSales,
        salesCount,
        targetAchieved,
        commissionEarned: Math.round(commissionEarned),
        commissionType: employee.commissionType
      }
    })

    return NextResponse.json(commissionData)
  } catch (error) {
    console.error('Commission calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate commissions' }, { status: 500 })
  }
}