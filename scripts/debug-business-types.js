const { MongoClient, ObjectId } = require('mongodb');

async function debugBusinessTypes() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/erp');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Debugging Business Types...\n');
    
    // 1. Check business types in database
    const businessTypesCollection = db.collection('business_types');
    const businessTypes = await businessTypesCollection.find({}).toArray();
    
    console.log('📋 Business Types in Database:');
    if (businessTypes.length === 0) {
      console.log('❌ No business types found! Run: node scripts/init-business-types-fix.js');
    } else {
      businessTypes.forEach(type => {
        console.log(`- ${type.name} (ID: ${type._id})`);
      });
    }
    
    console.log('\n👥 Tenants and their Business Types:');
    
    // 2. Check tenants and their business types
    const tenantsCollection = db.collection('tenants');
    const tenants = await tenantsCollection.find({}).toArray();
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found!');
    } else {
      tenants.forEach(tenant => {
        const businessType = tenant.businessType || 'none';
        console.log(`- ${tenant.name} (${tenant.email}): businessType = "${businessType}"`);
        
        if (businessType !== 'none') {
          const matchingType = businessTypes.find(bt => bt._id.toString() === businessType);
          if (matchingType) {
            console.log(`  ✅ Matches: ${matchingType.name}`);
          } else {
            console.log(`  ❌ No matching business type found for ID: ${businessType}`);
          }
        }
      });
    }
    
    // 3. Fix any tenant with invalid business type
    console.log('\n🔧 Fixing tenants with invalid business types...');
    
    if (businessTypes.length > 0) {
      const defaultBusinessTypeId = businessTypes[0]._id.toString();
      
      for (const tenant of tenants) {
        if (!tenant.businessType || tenant.businessType === 'none') {
          await tenantsCollection.updateOne(
            { _id: tenant._id },
            { $set: { businessType: defaultBusinessTypeId } }
          );
          console.log(`✅ Assigned "${businessTypes[0].name}" to ${tenant.name}`);
        }
      }
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await client.close();
  }
}

debugBusinessTypes();