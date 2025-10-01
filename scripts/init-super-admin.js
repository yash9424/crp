const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function initSuperAdmin() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    const db = client.db(dbName)
    const tenantsCollection = db.collection('tenants')
    
    // Create sample tenant
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const sampleTenant = {
      name: 'Demo Store',
      email: 'demo@store.com',
      password: hashedPassword,
      phone: '+1-555-0123',
      address: '123 Main St, City, State',
      plan: 'basic',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const existing = await tenantsCollection.findOne({ email: sampleTenant.email })
    if (!existing) {
      const result = await tenantsCollection.insertOne(sampleTenant)
      console.log('Sample tenant created:', result.insertedId)
      
      // Initialize tenant data
      const tenantId = result.insertedId.toString()
      const collections = ['customers', 'inventory', 'purchases', 'sales', 'employees', 'reports', 'settings']
      
      for (const collection of collections) {
        const tenantCollection = db.collection(`tenant_${tenantId}_${collection}`)
        
        if (collection === 'settings') {
          await tenantCollection.insertOne({
            tenantId,
            storeName: sampleTenant.name,
            currency: 'USD',
            timezone: 'UTC',
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
      
      console.log('Tenant data initialized')
    } else {
      console.log('Sample tenant already exists')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

initSuperAdmin()