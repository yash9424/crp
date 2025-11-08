import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      // Return default settings for unauthenticated users
      return NextResponse.json({ 
        storeName: 'Demo Store',
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
        fieldSettingsPassword: 'vivekVOra32*',
        discountMode: false,
        billFormat: 'professional'
      })
    }

    const db = await connectDB()
    const settingsCollection = db.collection(`settings_${session.user.tenantId}`)
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
      fieldSettingsPassword: 'vivekVOra32*',
      discountMode: false,
      billFormat: 'professional'
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    // Return default settings on error
    return NextResponse.json({ 
      storeName: 'Demo Store',
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
      fieldSettingsPassword: 'vivekVOra32*',
      discountMode: false,
      billFormat: 'professional'
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    const settingsCollection = db.collection(`settings_${session.user.tenantId}`)
    
    // Update settings
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
          fieldSettingsPassword: body.fieldSettingsPassword || 'vivekVOra32*',
          discountMode: body.discountMode === true || body.discountMode === 'true',
          billFormat: body.billFormat || 'professional',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    // Update business type in tenant collection if provided
    if (body.businessType !== undefined) {
      let tenantQuery
      try {
        tenantQuery = { _id: new ObjectId(session.user.tenantId) }
      } catch {
        tenantQuery = { _id: session.user.tenantId }
      }
      
      await db.collection('tenants').updateOne(
        tenantQuery,
        { 
          $set: {
            businessType: body.businessType,
            updatedAt: new Date()
          }
        }
      )
    }
    
    const updatedSettings = await settingsCollection.findOne({})
    return NextResponse.json({ ...updatedSettings, businessType: body.businessType })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}