const { MongoClient } = require('mongodb')

async function testPlanLimits() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system')
  
  try {
    await client.connect()
    const db = client.db()
    
    console.log('Testing plan limits functionality...')
    
    // Find a tenant with a plan
    const tenant = await db.collection('tenants').findOne({ plan: { $exists: true } })
    
    if (!tenant) {
      console.log('No tenant with plan found. Creating test scenario...')
      
      // Find a basic plan
      const basicPlan = await db.collection('plans').findOne({ name: /basic/i })
      
      if (basicPlan) {
        console.log(`Found plan: ${basicPlan.name} with ${basicPlan.maxProducts} max products`)
        
        // Update a tenant to use this plan
        const result = await db.collection('tenants').updateOne(
          {},
          { $set: { plan: basicPlan._id } }
        )
        
        if (result.modifiedCount > 0) {
          console.log('✅ Assigned plan to tenant for testing')
        }
      }
    } else {
      console.log(`Found tenant: ${tenant.name} with plan`)
      
      // Get plan details
      const plan = await db.collection('plans').findOne({ _id: tenant.plan })
      if (plan) {
        console.log(`Plan: ${plan.name}, Max Products: ${plan.maxProducts}`)
        
        // Check current product count
        const inventoryCollection = db.collection(`tenant_${tenant._id}_inventory`)
        const currentProducts = await inventoryCollection.countDocuments({})
        
        console.log(`Current products: ${currentProducts}/${plan.maxProducts}`)
        
        if (currentProducts >= plan.maxProducts) {
          console.log('🚫 Tenant is at product limit - upgrade popup should show')
        } else {
          console.log(`✅ Tenant can add ${plan.maxProducts - currentProducts} more products`)
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing plan limits:', error)
  } finally {
    await client.close()
  }
}

testPlanLimits()