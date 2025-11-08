import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const tenantId = session.user.tenantId
    
    // Get tenant settings
    const settings = await db.collection(`settings_${tenantId}`).findOne({})
    
    // Get low stock products
    const productsCollection = db.collection(`products_${tenantId}`)
    const lowStockProducts = await productsCollection.find({
      $or: [
        { $expr: { $lte: ['$stock', { $ifNull: ['$minStock', 10] }] } },
        { stock: { $lte: 10 }, minStock: { $exists: false } }
      ],
      stock: { $gte: 0 }
    }).toArray()
    
    if (lowStockProducts.length === 0) {
      return NextResponse.json({ 
        message: 'No low stock items found',
        lowStockProducts: []
      })
    }
    
    const alertMessage = `🚨 LOW STOCK ALERT - ${settings?.storeName || 'Store'}\n\n` +
      lowStockProducts.map(p => 
        `• ${p.name}: ${p.stock} left (Min: ${p.minStock || 10})`
      ).join('\n') +
      `\n\nTotal items: ${lowStockProducts.length}\nDate: ${new Date().toLocaleDateString()}`
    
    // Log the alert
    await db.collection('alert_logs').insertOne({
      tenantId,
      tenantName: settings?.storeName || 'Store',
      phone: settings?.phone || 'Not set',
      message: alertMessage,
      productsCount: lowStockProducts.length,
      sentAt: new Date(),
      status: 'manual_trigger',
      type: 'low_stock'
    })
    
    return NextResponse.json({
      message: 'Low stock alert generated',
      lowStockProducts,
      alertMessage,
      phone: settings?.phone || 'Phone not set in settings'
    })
    
  } catch (error) {
    console.error('Low stock alert error:', error)
    return NextResponse.json({ error: 'Failed to generate low stock alert' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const tenantId = session.user.tenantId
    
    // Get tenant settings
    const settings = await db.collection(`settings_${tenantId}`).findOne({})
    
    if (!settings?.phone) {
      return NextResponse.json({ 
        error: 'Phone number not set in store settings. Please add phone number to receive alerts.' 
      }, { status: 400 })
    }
    
    // Get low stock products
    const productsCollection = db.collection(`products_${tenantId}`)
    const lowStockProducts = await productsCollection.find({
      $or: [
        { $expr: { $lte: ['$stock', { $ifNull: ['$minStock', 10] }] } },
        { stock: { $lte: 10 }, minStock: { $exists: false } }
      ],
      stock: { $gte: 0 }
    }).toArray()
    
    if (lowStockProducts.length === 0) {
      return NextResponse.json({ 
        message: 'No low stock items to alert about',
        lowStockProducts: []
      })
    }
    
    const alertMessage = `🚨 LOW STOCK ALERT - ${settings.storeName}\n\n` +
      `Dear Store Owner,\n\n` +
      `Your inventory is running low on these items:\n\n` +
      lowStockProducts.map(p => 
        `• ${p.name}: Only ${p.stock} left (Min: ${p.minStock || 10})`
      ).join('\n') +
      `\n\n📊 Total items needing restock: ${lowStockProducts.length}` +
      `\n📅 Alert Date: ${new Date().toLocaleDateString()}` +
      `\n\n⚠️ Action Required: Please restock these items to maintain inventory levels.` +
      `\n\nBest regards,\nYour ERP System`
    
    // Create WhatsApp URL
    const phone = settings.phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(alertMessage)}`
    
    // Log the alert
    await db.collection('alert_logs').insertOne({
      tenantId,
      tenantName: settings.storeName,
      phone: settings.phone,
      message: alertMessage,
      productsCount: lowStockProducts.length,
      sentAt: new Date(),
      status: 'whatsapp_url_generated',
      type: 'low_stock',
      whatsappUrl
    })
    
    return NextResponse.json({
      message: 'Low stock alert ready to send',
      lowStockProducts,
      whatsappUrl,
      phone: settings.phone,
      productsCount: lowStockProducts.length
    })
    
  } catch (error) {
    console.error('Low stock alert error:', error)
    return NextResponse.json({ error: 'Failed to send low stock alert' }, { status: 500 })
  }
}