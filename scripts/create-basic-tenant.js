const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function createBasicTenant() {
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
    
    // Create basic tenant
    const hashedPassword = await bcrypt.hash('basic123', 10)
    
    const tenant = {
      name: 'Basic Store',
      email: 'basic@store.com',
      password: hashedPassword,
      phone: '+1234567890',
      address: '123 Basic Street',
      plan: basicPlan._id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const tenantResult = await tenantsCollection.insertOne(tenant)
    console.log('✅ Created basic tenant:', tenantResult.insertedId)
    
    // Create tenant admin user
    const user = {
      email: 'admin@basic.com',
      password: hashedPassword,
      name: 'Basic Admin',
      role: 'tenant-admin',
      tenantId: tenantResult.insertedId.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const userResult = await usersCollection.insertOne(user)
    console.log('✅ Created user:', userResult.insertedId)
    
    console.log('\n🎉 Basic tenant created!')
    console.log('📧 Login: admin@basic.com')
    console.log('🔑 Password: basic123')
    console.log(`📋 Plan: ${basicPlan.name} (${basicPlan.allowedFeatures.length} features)`)
    console.log(`🔧 Features: ${basicPlan.allowedFeatures.join(', ')}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

createBasicTenant()