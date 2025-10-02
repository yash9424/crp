const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function createTestTenantWithPlan() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const usersCollection = db.collection('users')
    const plansCollection = db.collection('plans')
    
    // Get Basic plan
    const basicPlan = await plansCollection.findOne({ name: 'Basic' })
    if (!basicPlan) {
      console.log('❌ Basic plan not found')
      return
    }
    
    console.log('Found Basic plan:', basicPlan.name, 'with features:', basicPlan.allowedFeatures)
    
    // Create test tenant with Basic plan
    const hashedPassword = await bcrypt.hash('test123', 10)
    
    const tenant = {
      name: 'Monthly Plan Store',
      email: 'monthly@store.com',
      password: hashedPassword,
      phone: '+1234567890',
      address: '123 Monthly Street',
      plan: basicPlan._id, // Assign plan ID
      status: 'active',
      referralCode: 'MONTHLY123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const tenantResult = await tenantsCollection.insertOne(tenant)
    console.log('✅ Created tenant:', tenantResult.insertedId)
    
    // Create tenant admin user
    const user = {
      email: 'monthly@store.com',
      password: hashedPassword,
      name: 'Monthly Store Admin',
      role: 'tenant-admin',
      tenantId: tenantResult.insertedId.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const userResult = await usersCollection.insertOne(user)
    console.log('✅ Created user:', userResult.insertedId)
    
    console.log('\n🎉 Monthly Plan tenant created!')
    console.log('📧 Login: monthly@store.com')
    console.log('🔑 Password: test123')
    console.log(`📋 Plan: ${basicPlan.name} (${basicPlan.allowedFeatures.length} features)`)
    console.log(`🔧 Features: ${basicPlan.allowedFeatures.join(', ')}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

createTestTenantWithPlan()