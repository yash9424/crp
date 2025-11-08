const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function initReferralsCollection() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('erp_system');
    
    // Create referrals collection with sample data
    const sampleReferrals = [
      {
        referrerShop: "Fashion Store Ltd",
        referralCode: "FASHIO123",
        referredShop: "New Fashion Hub",
        referredEmail: "contact@newfashionhub.com",
        planType: "Professional",
        reward: 299,
        status: "Completed",
        dateReferred: "2024-09-20",
        dateCompleted: "2024-09-22",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        referrerShop: "Style Boutique",
        referralCode: "STYLEB456",
        referredShop: "Trendy Clothes Co",
        referredEmail: "info@trendyclothes.com",
        planType: "Enterprise",
        reward: 499,
        status: "Pending",
        dateReferred: "2024-09-23",
        dateCompleted: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        referrerShop: "Tech Solutions Inc",
        referralCode: "TECHSO789",
        referredShop: "Digital Innovations",
        referredEmail: "hello@digitalinnovations.com",
        planType: "Basic",
        reward: 199,
        status: "Active",
        dateReferred: "2024-09-25",
        dateCompleted: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Drop existing collection if it exists
    try {
      await db.collection('referrals').drop();
      console.log('Existing referrals collection dropped');
    } catch (error) {
      console.log('No existing collection to drop');
    }
    
    // Insert sample data
    const result = await db.collection('referrals').insertMany(sampleReferrals);
    console.log(`Created referrals collection with ${result.insertedCount} documents`);
    
    // Create indexes for better performance
    await db.collection('referrals').createIndex({ referralCode: 1 }, { unique: true });
    await db.collection('referrals').createIndex({ status: 1 });
    await db.collection('referrals').createIndex({ createdAt: -1 });
    
    console.log('Indexes created successfully');
    console.log('Referrals collection initialized!');
    
  } catch (error) {
    console.error('Error initializing referrals collection:', error);
  } finally {
    await client.close();
  }
}

initReferralsCollection();