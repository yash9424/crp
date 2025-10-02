const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function assignPlansToAllTenants() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const tenantsCollection = db.collection('tenants')
    const plansCollection = db.collection('plans')
    
    // Get all plans
    const plans = await plansCollection.find({}).toArray()
    const basicPlan = plans.find(p => p.name === 'Basic')
    const standardPlan = plans.find(p => p.name === 'Standard')
    const premiumPlan = plans.find(p => p.name === 'Premium')
    
    console.log('Available plans:')
    plans.forEach(plan => {
      console.log(`- ${plan.name}: ${plan.allowedFeatures.length} features`)
    })
    
    // Get all tenants
    const tenants = await tenantsCollection.find({}).toArray()
    console.log(`\nFound ${tenants.length} tenants`)
    
    let updated = 0
    
    for (const tenant of tenants) {
      if (!tenant.plan) {
        // Assign Premium plan to all existing tenants for demo
        await tenantsCollection.updateOne(
          { _id: tenant._id },
          { 
            $set: { 
              plan: premiumPlan._id,
              updatedAt: new Date()
            }
          }
        )
        
        console.log(`✅ Assigned Premium plan to ${tenant.name}`)
        updated++
      } else {
        console.log(`⏭️  ${tenant.name} already has a plan`)
      }
    }
    
    console.log(`\n🎉 Updated ${updated} tenants with Premium plan access`)
    console.log('All existing tenants now have full feature access!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

assignPlansToAllTenants()