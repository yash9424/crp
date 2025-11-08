const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function assignPlanToExistingTenant() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    
    // Get all existing tenants
    const tenants = await tenantsCollection.find({}).toArray()
    const plans = await plansCollection.find({}).toArray()
    
    console.log('\n=== EXISTING TENANTS ===')
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.email}) - Plan: ${tenant.plan ? 'Assigned' : 'NO PLAN'}`)
    })
    
    console.log('\n=== AVAILABLE PLANS ===')
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - ₹${plan.price}/month (${plan.allowedFeatures.length} features)`)
    })
    
    // Find tenants without plans and assign Basic plan
    const basicPlan = plans.find(p => p.name === 'Basic')
    const standardPlan = plans.find(p => p.name === 'Standard')
    const premiumPlan = plans.find(p => p.name === 'Premium')
    
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i]
      
      if (!tenant.plan) {
        // Assign different plans to different tenants for testing
        let planToAssign
        if (i % 3 === 0) planToAssign = basicPlan
        else if (i % 3 === 1) planToAssign = standardPlan
        else planToAssign = premiumPlan
        
        await tenantsCollection.updateOne(
          { _id: tenant._id },
          { 
            $set: { 
              plan: planToAssign._id,
              updatedAt: new Date()
            }
          }
        )
        
        console.log(`\n✅ Assigned ${planToAssign.name} plan to ${tenant.name}`)
        console.log(`   Features: ${planToAssign.allowedFeatures.join(', ')}`)
      }
    }
    
    console.log('\n🎉 All tenants now have plans assigned!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

assignPlanToExistingTenant()