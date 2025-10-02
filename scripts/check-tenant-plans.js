const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function checkTenantPlans() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    const usersCollection = db.collection('users')
    
    // Get all tenants with their plans
    const tenants = await tenantsCollection.find({}).toArray()
    const plans = await plansCollection.find({}).toArray()
    const users = await usersCollection.find({}).toArray()
    
    console.log('\n=== TENANT PLAN ASSIGNMENTS ===')
    
    for (const tenant of tenants) {
      const plan = plans.find(p => p._id.toString() === tenant.plan?.toString())
      const user = users.find(u => u.tenantId === tenant._id.toString())
      
      console.log(`\n🏪 ${tenant.name}`)
      console.log(`   📧 Login: ${user?.email || 'No user found'}`)
      console.log(`   📋 Plan: ${plan?.name || 'No plan'} (₹${plan?.price || 0}/month)`)
      console.log(`   🔧 Features: ${plan?.allowedFeatures?.join(', ') || 'None'}`)
      console.log(`   📊 Feature Count: ${plan?.allowedFeatures?.length || 0}`)
    }
    
    console.log('\n=== LOGIN CREDENTIALS ===')
    for (const user of users.filter(u => u.role === 'tenant-admin')) {
      const tenant = tenants.find(t => t._id.toString() === user.tenantId)
      const plan = plans.find(p => p._id.toString() === tenant?.plan?.toString())
      
      console.log(`\n📧 ${user.email}`)
      console.log(`🔑 Password: Check creation script`)
      console.log(`🏪 Store: ${tenant?.name}`)
      console.log(`📋 Plan: ${plan?.name} (${plan?.allowedFeatures?.length || 0} features)`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

checkTenantPlans()