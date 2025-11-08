const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function assignPlanToTenant() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    
    // Get all tenants and plans
    const tenants = await tenantsCollection.find({}).toArray()
    const plans = await plansCollection.find({}).toArray()
    
    console.log('\nAvailable Plans:')
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - ₹${plan.price}/month (Features: ${plan.allowedFeatures.length})`)
    })
    
    console.log('\nAvailable Tenants:')
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.email})`)
    })
    
    // For demo, assign Basic plan to first tenant
    if (tenants.length > 0 && plans.length > 0) {
      const tenant = tenants[0]
      const basicPlan = plans.find(p => p.name === 'Basic')
      
      if (basicPlan) {
        await tenantsCollection.updateOne(
          { _id: tenant._id },
          { 
            $set: { 
              plan: basicPlan._id,
              updatedAt: new Date()
            }
          }
        )
        
        console.log(`\n✅ Assigned ${basicPlan.name} plan to ${tenant.name}`)
        console.log(`   Allowed features: ${basicPlan.allowedFeatures.join(', ')}`)
      }
    }
    
  } catch (error) {
    console.error('Error assigning plan:', error)
  } finally {
    await client.close()
  }
}

assignPlanToTenant()