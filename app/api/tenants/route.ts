import { NextRequest, NextResponse } from 'next/server'
import { getTenantsCollection, getUsersCollection } from '@/lib/database'
import { initializeTenantData } from '@/lib/tenant-data'
import { generateReferralCode, createReferralRecord, calculateReward, findReferrerByCode } from '@/lib/referral-utils'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

// GET - Fetch all tenants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const tenantsCollection = await getTenantsCollection()
    const usersCollection = await getUsersCollection()
    
    const total = await tenantsCollection.countDocuments({})
    const tenants = await tenantsCollection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    
    // Get users for each tenant
    for (const tenant of tenants) {
      const users = await usersCollection.find({ tenantId: tenant._id.toString() }).toArray()
      tenant.users = users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }))
      tenant.id = tenant._id.toString()
      // Include plan expiry date for status checking
      tenant.planExpiryDate = tenant.planExpiryDate || null
    }
    
    return NextResponse.json({
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address, plan, tenantType, businessType, referralCode, customReward } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const tenantsCollection = await getTenantsCollection()
    const { connectDB } = require('@/lib/database')
    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    // Check if tenant already exists
    const existingTenant = await tenantsCollection.findOne({ email })
    if (existingTenant) {
      return NextResponse.json({ error: 'Tenant with this email already exists' }, { status: 400 })
    }

    // Find plan by ID or name and get its ID
    let planId = null
    if (plan) {
      let planDoc = null
      
      // Try to find by ObjectId first (if plan is an ID)
      try {
        planDoc = await plansCollection.findOne({ _id: new ObjectId(plan) })
      } catch {
        // If not ObjectId, try by name
        planDoc = await plansCollection.findOne({ name: { $regex: new RegExp(plan, 'i') } })
      }
      
      if (planDoc) {
        planId = planDoc._id
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Generate unique referral code for this tenant
    const tenantReferralCode = generateReferralCode(name)
    
    const tenant = {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      plan: planId,
      tenantType: tenantType || 'retail',
      businessType: businessType && businessType !== 'none' ? businessType : null,
      status: 'active',
      referralCode: tenantReferralCode,
      usedReferralCode: referralCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await tenantsCollection.insertOne(tenant)
    
    // Create admin user for the tenant
    const usersCollection = await getUsersCollection()
    const adminUser = {
      email,
      password: hashedPassword,
      name: `${name} Admin`,
      role: 'tenant-admin',
      tenantId: result.insertedId.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await usersCollection.insertOne(adminUser)
    
    // Initialize tenant-specific data collections
    await initializeTenantData(result.insertedId.toString())
    
    // Handle referral if provided
    if (referralCode) {
      const referrerName = await findReferrerByCode(referralCode)
      const reward = customReward ? parseInt(customReward) : calculateReward(plan)
      
      await createReferralRecord({
        referralCode,
        referrerShop: referrerName,
        referredShop: name,
        referredEmail: email,
        planType: plan,
        reward
      })
    }
    
    const newTenant = { ...tenant, id: result.insertedId.toString(), users: [], password: undefined }

    return NextResponse.json(newTenant, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

