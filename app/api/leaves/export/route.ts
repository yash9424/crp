import { NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    const leaves = await leavesCollection.find({}).sort({ createdAt: -1 }).toArray()

    const csv = [
      'Employee Name,Leave Type,Start Date,End Date,Days,Reason,Status',
      ...leaves.map(l => 
        `"${l.employeeName}","${l.leaveType}","${l.startDate}","${l.endDate}",${l.days},"${l.reason}","${l.status}"`
      )
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leaves.csv"'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export leaves' }, { status: 500 })
  }
}
