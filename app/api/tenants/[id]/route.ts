import { NextRequest, NextResponse } from 'next/server'
import { getTenantsCollection } from '@/lib/database'
import { cleanupTenantData } from '@/lib/tenant-data'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

// PUT - Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address, plan, tenantType, businessType, status } = body

    const tenantsCollection = await getTenantsCollection()
    
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      plan: plan || 'basic',
      tenantType: tenantType || 'retail',
      businessType: businessType && businessType !== 'none' ? businessType : null,
      status: status || 'active',
      updatedAt: new Date()
    }

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const result = await tenantsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Tenant updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

// DELETE - Delete tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantsCollection = await getTenantsCollection()
    
    const result = await tenantsCollection.deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Clean up all tenant-specific data
    await cleanupTenantData(params.id)

    return NextResponse.json({ message: 'Tenant deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}