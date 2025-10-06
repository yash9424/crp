import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    const settings = await settingsCollection.findOne({})
    
    return NextResponse.json(settings || { 
      storeName: session.user.storeName || 'Store',
      address: '',
      phone: '',
      email: '',
      gst: '',
      taxRate: 0,
      terms: '',
      billPrefix: 'BILL',
      billCounter: 1,
      whatsappMessage: '',
      deletePassword: 'admin123',
      discountMode: false
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    
    const result = await settingsCollection.updateOne(
      {},
      { 
        $set: {
          storeName: body.storeName || 'Store',
          address: body.address || '',
          phone: body.phone || '',
          email: body.email || '',
          gst: body.gst || '',
          taxRate: parseFloat(body.taxRate) || 0,
          terms: body.terms || '',
          billPrefix: body.billPrefix || 'BILL',
          billCounter: parseInt(body.billCounter) || 1,
          whatsappMessage: body.whatsappMessage || '',
          deletePassword: body.deletePassword || 'admin123',
          discountMode: body.discountMode === true || body.discountMode === 'true',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    const updatedSettings = await settingsCollection.findOne({})
    return NextResponse.json(updatedSettings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}