import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantPlanLimits } from '@/lib/plan-limits'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    // Check current product count and limits
    const limits = await getTenantPlanLimits(session.user.tenantId)
    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    const currentCount = await inventoryCollection.countDocuments({})
    
    const items = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.replace(/"/g, ''))
      
      const item = {
        name: values[0] || '',
        sku: values[1] || '',
        category: values[2] || '',
        price: parseFloat(values[3]) || 0,
        costPrice: parseFloat(values[4]) || 0,
        stock: parseInt(values[5]) || 0,
        minStock: parseInt(values[6]) || 0,
        sizes: [],
        colors: [],
        description: '',
        tenantId: session.user.tenantId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      items.push(item)
    }
    
    if (items.length > 0) {
      // Check if importing would exceed limits
      if (limits && (currentCount + items.length) > limits.maxProducts) {
        return NextResponse.json({ 
          error: 'PRODUCT_LIMIT_EXCEEDED',
          message: `Cannot import ${items.length} products. Your ${limits.planName} plan allows ${limits.maxProducts} products. You currently have ${currentCount} products.`,
          limits: {
            ...limits,
            currentProducts: currentCount
          }
        }, { status: 403 })
      }
      
      await inventoryCollection.insertMany(items)
    }
    
    return NextResponse.json({ 
      message: `Successfully imported ${items.length} items`,
      count: items.length 
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import inventory' }, { status: 500 })
  }
}