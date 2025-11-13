import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')
    const purchases = await purchasesCollection.find({}).sort({ createdAt: -1 }).toArray()

    const csv = [
      'PO Number,Supplier Name,Supplier Contact,Order Date,Items,Subtotal,Tax,Total,Status,Notes',
      ...purchases.map(p => {
        const itemsStr = (p.items || []).map((i: any) => `${i.name}(${i.quantity}x${i.unitPrice})`).join('; ')
        return `"${p.poNumber}","${p.supplierName}","${p.supplierContact || ''}","${p.orderDate}","${itemsStr}",${p.subtotal || 0},${p.tax || 0},${p.total || 0},"${p.status}","${p.notes || ''}"`
      })
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="purchases_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export purchases' }, { status: 500 })
  }
}
