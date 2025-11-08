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
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // Check current product count and limits
    const limits = await getTenantPlanLimits(session.user.tenantId)
    const db = await connectDB()
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)
    const currentCount = await inventoryCollection.countDocuments({})
    
    const items = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      
      const item: any = {
        tenantId: session.user.tenantId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Map ALL CSV columns to item properties
      headers.forEach((header, index) => {
        const value = values[index] || ''
        if (value) {
          const fieldKey = header.toLowerCase().replace(/\s+/g, '_')
          
          // Store with original header name
          item[header] = value
          // Store with field key version
          item[fieldKey] = value
          // Store with lowercase version
          item[header.toLowerCase()] = value
          
          // Handle numeric fields
          if (['price', 'costprice', 'cost_price', 'stock', 'minstock', 'min_stock'].includes(fieldKey)) {
            item[header] = parseFloat(value) || 0
            item[fieldKey] = parseFloat(value) || 0
          }
          // Handle array fields
          else if (['sizes', 'colors'].includes(fieldKey)) {
            const arrayValue = value.split(',').map(v => v.trim()).filter(v => v)
            item[header] = arrayValue
            item[fieldKey] = arrayValue
          }
        }
      })
      
      // Ensure required fields exist
      if (!item.name && !item.productname && !item['Product Name']) {
        continue // Skip items without name
      }
      
      // Set name field for consistency
      item.name = item.name || item.productname || item['Product Name'] || item.ProductName || ''
      
      // Generate SKU if not provided
      if (!item.sku) {
        item.sku = `SKU-${Date.now()}-${i}`
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