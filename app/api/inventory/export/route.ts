import { NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
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
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    const tenantFieldsCollection = db.collection('tenant_fields')
    
    // Get tenant field configuration
    const tenantConfig = await tenantFieldsCollection.findOne({ tenantId: session.user.tenantId })
    const enabledFields = tenantConfig?.fields?.filter((f: any) => f.enabled) || []
    
    const inventory = await inventoryCollection.find({}).toArray()
    
    if (inventory.length === 0) {
      return new Response('No data to export', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="inventory.csv"'
        }
      })
    }
    
    // Use only enabled tenant fields (same as shown in table)
    const headers = enabledFields.length > 0 
      ? enabledFields.map((field: any) => field.name)
      : ['name', 'sku', 'category', 'price', 'stock'] // fallback
    
    const csvRows = [headers.join(',')]
    
    inventory.forEach(item => {
      const row: string[] = []
      
      headers.forEach(header => {
        const fieldKey = header.toLowerCase().replace(/\s+/g, '_')
        let value = item[header] || item[fieldKey] || item[header.toLowerCase()] || ''
        
        // Handle special name field mapping
        if (header.toLowerCase().includes('name') && !value) {
          value = item.name || ''
        }
        
        if (Array.isArray(value)) {
          value = value.join(', ')
        } else {
          value = String(value)
        }
        
        // Wrap in quotes and escape existing quotes
        row.push(`"${value.replace(/"/g, '""')}"`)
      })
      
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
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export inventory' }, { status: 500 })
  }
}