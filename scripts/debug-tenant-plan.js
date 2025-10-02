const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function debugTenantPlan() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    
    // Get all tenants
    const tenants = await tenantsCollection.find({}).toArray()
    console.log('\n=== TENANTS ===')
    tenants.forEach(tenant => {
      console.log(`ID: ${tenant._id}`)
      console.log(`Name: ${tenant.name}`)
      console.log(`Email: ${tenant.email}`)
      console.log(`Plan: ${tenant.plan || 'NO PLAN ASSIGNED'}`)
      console.log('---')
    })
    
    // Get all plans
    const plans = await plansCollection.find({}).toArray()
    console.log('\n=== PLANS ===')
    plans.forEach(plan => {
      console.log(`ID: ${plan._id}`)
      console.log(`Name: ${plan.name}`)
      console.log(`Features: ${plan.allowedFeatures ? plan.allowedFeatures.join(', ') : 'NO FEATURES'}`)
      console.log('---')
    })
    
    // Assign Premium plan to first tenant if no plan assigned
    if (tenants.length > 0 && plans.length > 0) {
      const tenant = tenants[0]
      const premiumPlan = plans.find(p => p.name === 'Premium')
      
      if (premiumPlan && !tenant.plan) {
        console.log(`\n🔧 Assigning ${premiumPlan.name} plan to ${tenant.name}...`)
        
        await tenantsCollection.updateOne(
          { _id: tenant._id },
          { 
            $set: { 
              plan: premiumPlan._id,
              updatedAt: new Date()
            }
          }
        )
        
        console.log('✅ Plan assigned successfully!')
        console.log(`   Tenant: ${tenant.name}`)
        console.log(`   Plan: ${premiumPlan.name}`)
        console.log(`   Features: ${premiumPlan.allowedFeatures.join(', ')}`)
      } else if (tenant.plan) {
        console.log(`\n✅ ${tenant.name} already has a plan assigned`)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

debugTenantPlan()