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

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const inventory = await inventoryCollection.find({}).toArray()
    
    // Create CSV content
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost Price', 'Stock', 'Min Stock']
    const csvRows = [headers.join(',')]
    
    inventory.forEach(item => {
      const row = [
        `"${item.name || ''}"`,
        `"${item.sku || ''}"`,
        `"${item.category || ''}"`,
        item.price || 0,
        item.costPrice || 0,
        item.stock || 0,
        item.minStock || 0
      ]
      csvRows.push(row.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="inventory.csv"'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export inventory' }, { status: 500 })
  }
}