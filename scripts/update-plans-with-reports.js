const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

async function updatePlansWithReports() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const plansCollection = db.collection('plans')
    
    // Update Standard plan to include reports
    const standardResult = await plansCollection.updateMany(
      { name: 'Standard' },
      { 
        $addToSet: { allowedFeatures: 'reports' },
        $set: { updatedAt: new Date() }
      }
    )
    
    // Update Premium plan to include reports (if not already there)
    const premiumResult = await plansCollection.updateMany(
      { name: 'Premium' },
      { 
        $addToSet: { allowedFeatures: 'reports' },
        $set: { updatedAt: new Date() }
      }
    )
    
    console.log(`Updated ${standardResult.modifiedCount} Standard plans`)
    console.log(`Updated ${premiumResult.modifiedCount} Premium plans`)
    
    // Display updated plans
    const plans = await plansCollection.find({}).toArray()
    plans.forEach(plan => {
      console.log(`\n${plan.name} Plan:`)
      console.log(`  Allowed Features: ${plan.allowedFeatures.join(', ')}`)
      console.log(`  Has Reports: ${plan.allowedFeatures.includes('reports') ? 'Yes' : 'No'}`)
    })
    
  } catch (error) {
    console.error('Error updating plans:', error)
  } finally {
    await client.close()
  }
}

updatePlansWithReports()