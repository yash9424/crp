const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/erp_system'

async function initBusinessTypes() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db()
    
    const businessTypes = [
      {
        name: 'Clothing Store',
        description: 'Fashion retail store with clothing inventory management',
        fields: [
          { name: 'Size', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
          { name: 'Color', type: 'text', required: true },
          { name: 'Material', type: 'select', required: false, options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Denim', 'Leather'] },
          { name: 'Season', type: 'select', required: false, options: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'] },
          { name: 'Brand', type: 'text', required: false }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Electronics Store',
        description: 'Electronics retail store with tech product management',
        fields: [
          { name: 'Model Number', type: 'text', required: true },
          { name: 'Warranty Period', type: 'select', required: true, options: ['6 months', '1 year', '2 years', '3 years'] },
          { name: 'Brand', type: 'text', required: true },
          { name: 'Power Rating', type: 'text', required: false },
          { name: 'Specifications', type: 'textarea', required: false }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Grocery Store',
        description: 'Food and grocery retail store with expiry date tracking',
        fields: [
          { name: 'Expiry Date', type: 'date', required: true },
          { name: 'Batch Number', type: 'text', required: false },
          { name: 'Storage Type', type: 'select', required: true, options: ['Room Temperature', 'Refrigerated', 'Frozen'] },
          { name: 'Organic', type: 'select', required: false, options: ['Yes', 'No'] },
          { name: 'Weight/Volume', type: 'text', required: false }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // Clear existing business types
    await db.collection('business_types').deleteMany({})
    
    // Insert new business types
    const result = await db.collection('business_types').insertMany(businessTypes)
    
    console.log(`✅ Created ${result.insertedCount} business types:`)
    businessTypes.forEach(type => {
      console.log(`   - ${type.name}: ${type.description}`)
    })
    
  } catch (error) {
    console.error('❌ Error initializing business types:', error)
  } finally {
    await client.close()
  }
}

initBusinessTypes()