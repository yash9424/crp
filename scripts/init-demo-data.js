const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function initDemoData() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(dbName)
    
    // Create demo tenant
    const tenantsCollection = db.collection('tenants')
    const existingTenant = await tenantsCollection.findOne({ email: 'demo@store.com' })
    
    if (!existingTenant) {
      const demoTenant = {
        name: 'Demo Store',
        email: 'demo@store.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        status: 'active',
        tenantType: 'retail',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await tenantsCollection.insertOne(demoTenant)
      console.log('Demo tenant created:', result.insertedId)
      
      // Create demo settings
      const settingsCollection = db.collection(`settings_${result.insertedId}`)
      await settingsCollection.insertOne({
        storeName: 'Demo Store',
        address: '123 Demo Street',
        phone: '+1234567890',
        email: 'demo@store.com',
        gst: 'DEMO123456789',
        taxRate: 18,
        terms: 'Thank you for your business!',
        billPrefix: 'DEMO',
        billCounter: 1,
        whatsappMessage: 'Thank you for shopping with us!',
        deletePassword: 'admin123',
        discountMode: false,
        billFormat: 'professional',
        createdAt: new Date()
      })
      
      // Create demo customers
      const customersCollection = db.collection(`customers_${result.insertedId}`)
      await customersCollection.insertMany([
        {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          address: '123 Main St',
          orderCount: 5,
          totalSpent: 2500,
          lastOrderDate: new Date(),
          tenantId: result.insertedId.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Jane Smith',
          phone: '+1234567891',
          email: 'jane@example.com',
          address: '456 Oak Ave',
          orderCount: 3,
          totalSpent: 1800,
          lastOrderDate: new Date(),
          tenantId: result.insertedId.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
      
      // Create demo products
      const productsCollection = db.collection(`products_${result.insertedId}`)
      await productsCollection.insertMany([
        {
          name: 'Cotton T-Shirt',
          price: 299,
          stock: 50,
          minStock: 10,
          category: 'Clothing',
          size: 'M',
          color: 'Blue',
          tenantId: result.insertedId.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Denim Jeans',
          price: 899,
          stock: 25,
          minStock: 5,
          category: 'Clothing',
          size: 'L',
          color: 'Black',
          tenantId: result.insertedId.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
      
      console.log('Demo data initialized successfully')
    } else {
      console.log('Demo tenant already exists')
    }
    
  } catch (error) {
    console.error('Error initializing demo data:', error)
  } finally {
    await client.close()
  }
}

initDemoData()