const { MongoClient } = require('mongodb');

async function setTenantExpiry() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('erp_system');
    const tenantsCollection = db.collection('tenants');
    
    // Set expiry date to 1 day from now for all tenants
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await tenantsCollection.updateMany(
      {},
      {
        $set: {
          planExpiryDate: tomorrow,
          planName: 'Test Plan',
          status: 'active'
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} tenants with expiry date: ${tomorrow}`);
    
    // Show all tenants
    const tenants = await tenantsCollection.find({}).toArray();
    console.log('\nAll tenants:');
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name || tenant._id}: expires ${tenant.planExpiryDate}, status: ${tenant.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

setTenantExpiry();