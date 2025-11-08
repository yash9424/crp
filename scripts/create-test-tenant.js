const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function createTestTenant() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const usersCollection = db.collection('users')
    const plansCollection = db.collection('plans')
    
    // Get Premium plan
    const premiumPlan = await plansCollection.findOne({ name: 'Premium' })
    if (!premiumPlan) {
      console.log('❌ Premium plan not found')
      return
    }
    
    // Create test tenant
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const tenant = {
      name: 'Test Clothing Store',
      email: 'test@clothingstore.com',
      password: hashedPassword,
      phone: '+1234567890',
      address: '123 Fashion Street',
      plan: premiumPlan._id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const tenantResult = await tenantsCollection.insertOne(tenant)
    console.log('✅ Created tenant:', tenantResult.insertedId)
    
    // Create tenant admin user
    const user = {
      email: 'admin@clothingstore.com',
      password: hashedPassword,
      name: 'Store Admin',
      role: 'tenant-admin',
      tenantId: tenantResult.insertedId.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const userResult = await usersCollection.insertOne(user)
    console.log('✅ Created user:', userResult.insertedId)
    
    console.log('\n🎉 Test tenant created successfully!')
    console.log('📧 Login: admin@clothingstore.com')
    console.log('🔑 Password: password123')
    console.log(`📋 Plan: ${premiumPlan.name} (${premiumPlan.allowedFeatures.length} features)`)
    console.log(`🔧 Features: ${premiumPlan.allowedFeatures.join(', ')}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

createTestTenant()