const { MongoClient } = require('mongodb')

function generateReferralCode(tenantName) {
  const prefix = tenantName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

async function initReferralCodes() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('erp_system')
    
    // Find tenants without referral codes
    const tenants = await db.collection('tenants').find({ 
      referralCode: { $exists: false } 
    }).toArray()
    
    console.log(`Found ${tenants.length} tenants without referral codes`)
    
    for (const tenant of tenants) {
      const referralCode = generateReferralCode(tenant.name)
      
      await db.collection('tenants').updateOne(
        { _id: tenant._id },
        { 
          $set: { 
            referralCode,
            updatedAt: new Date()
          }
        }
      )
      
      console.log(`Generated referral code ${referralCode} for ${tenant.name}`)
    }
    
    console.log('Referral codes initialization completed')
  } catch (error) {
    console.error('Error initializing referral codes:', error)
  } finally {
    await client.close()
  }
}

initReferralCodes()