import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    const dataLines = lines.slice(1)
    const purchasesCollection = await getTenantCollection(session.user.tenantId, 'purchases')

    let imported = 0
    for (const line of dataLines) {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || []
      
      if (values.length < 4 || !values[0]) continue

      const itemsStr = values[4] || ''
      const items = itemsStr.split(';').map(itemStr => {
        const match = itemStr.match(/(.+?)\((\d+)x([\d.]+)\)/)
        if (match) {
          const quantity = parseInt(match[2])
          const unitPrice = parseFloat(match[3])
          return {
            name: match[1].trim(),
            sku: '',
            quantity,
            unitPrice,
            total: quantity * unitPrice
          }
        }
        return null
      }).filter(Boolean)

      const purchaseData = {
        poNumber: values[0],
        supplierName: values[1],
        supplierContact: values[2] || null,
        orderDate: values[3],
        items,
        subtotal: parseFloat(values[5]) || 0,
        tax: parseFloat(values[6]) || 0,
        total: parseFloat(values[7]) || 0,
        status: values[8] || 'pending',
        notes: values[9] || '',
        tenantId: session.user.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await purchasesCollection.insertOne(purchaseData)
      imported++
    }

    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import purchases' }, { status: 500 })
  }
}
