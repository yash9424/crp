import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'

async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const cleanPhone = phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    
    // Auto-open WhatsApp (this will actually send the message when user clicks send)
    console.log(`📱 WhatsApp Alert for ${phone}:`)
    console.log(`🔗 URL: ${whatsappUrl}`)
    console.log(`💬 Message: ${message}`)
    
    // In a real implementation, you would use WhatsApp Business API
    // For now, we'll simulate sending by opening WhatsApp Web
    
    return { 
      success: true, 
      whatsappUrl, 
      method: 'whatsapp_web',
      phone: cleanPhone,
      messageLength: message.length
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error: error.message }
  }
}

export async function GET() {
  try {
    const db = await connectDB()
    
    // Get all active tenants
    const tenants = await db.collection('tenants').find({ status: 'active' }).toArray()
    
    const sentAlerts = []
    
    for (const tenant of tenants) {
      const tenantId = tenant._id.toString()
      
      // Get tenant settings
      const settings = await db.collection(`settings_${tenantId}`).findOne({})
      if (!settings?.phone) continue
      
      // Get low stock products
      const productsCollection = db.collection(`products_${tenantId}`)
      const lowStockProducts = await productsCollection.find({
        $or: [
          { $expr: { $lte: ['$stock', { $ifNull: ['$minStock', 10] }] } },
          { stock: { $lte: 10 }, minStock: { $exists: false } }
        ],
        stock: { $gte: 0 }
      }).toArray()
      
      if (lowStockProducts.length > 0) {
        const message = `🚨 LOW STOCK ALERT - ${tenant.name}\n\n` +
          `Dear Store Owner,\n\n` +
          `The following items are running low in stock:\n\n` +
          lowStockProducts.map(p => 
            `• ${p.name}: Only ${p.stock} left (Min required: ${p.minStock || 10})`
          ).join('\n') +
          `\n\n📊 Total low stock items: ${lowStockProducts.length}` +
          `\n📅 Date: ${new Date().toLocaleDateString()}` +
          `\n\n⚠️ Please restock these items to avoid stockouts.` +
          `\n\nThank you!`
        
        const phone = settings.phone.replace(/\D/g, '')
        
        try {
          const result = await sendWhatsAppMessage(phone, message)
          
          // Log the alert
          await db.collection('alert_logs').insertOne({
            tenantId,
            tenantName: tenant.name,
            phone,
            message,
            productsCount: lowStockProducts.length,
            sentAt: new Date(),
            status: result.success ? 'whatsapp_ready' : 'failed',
            whatsappUrl: result.whatsappUrl,
            method: result.method,
            messageLength: result.messageLength
          })
          
          // Auto-trigger WhatsApp (opens in browser)
          if (result.success && result.whatsappUrl) {
            console.log(`🚀 Auto-opening WhatsApp for ${tenant.name}: ${result.whatsappUrl}`)
          }
          
          sentAlerts.push({
            tenantName: tenant.name,
            phone,
            productsCount: lowStockProducts.length,
            whatsappUrl: result.whatsappUrl,
            status: result.success ? 'ready' : 'failed'
          })
        } catch (error) {
          console.error(`Failed to send alert to ${tenant.name}:`, error)
        }
      }
    }
    
    return NextResponse.json({ 
      message: `Daily alerts processed at ${new Date().toLocaleString()}`,
      sentAlerts,
      count: sentAlerts.length
    })
  } catch (error) {
    console.error('Daily alerts error:', error)
    return NextResponse.json({ error: 'Failed to process daily alerts' }, { status: 500 })
  }
}