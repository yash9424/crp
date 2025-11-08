const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)

async function createReferralCollection() {
  try {
    await client.connect()
    const db = client.db('erp_system')
    
    // Create referral collection (singular)
    await db.createCollection('referral')
    console.log('✅ Referral collection created in MongoDB')
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Referral collection already exists')
    } else {
      console.error('❌ Error:', error)
    }
  } finally {
    await client.close()
  }
}

createReferralCollection()