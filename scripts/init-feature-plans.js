const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system'

const defaultPlans = [
  {
    name: 'Basic',
    price: 999,
    features: ['Basic POS', 'Inventory Management', 'Customer Management'],
    maxUsers: 2,
    maxProducts: 500,
    description: 'Perfect for small clothing stores just getting started',
    allowedFeatures: ['dashboard', 'inventory', 'pos', 'customers', 'settings'],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Standard',
    price: 1999,
    features: ['Advanced POS', 'Inventory Management', 'Purchase Orders', 'HR Management', 'Bills & Invoicing'],
    maxUsers: 5,
    maxProducts: 2000,
    description: 'Ideal for growing clothing businesses with multiple staff',
    allowedFeatures: ['dashboard', 'inventory', 'pos', 'customers', 'purchases', 'bills', 'hr', 'reports', 'expenses', 'settings', 'dropdownSettings'],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Premium',
    price: 3999,
    features: ['Full ERP Suite', 'Advanced Analytics', 'WhatsApp Integration', 'Referral System', 'Leave Management', 'Salary Management'],
    maxUsers: 20,
    maxProducts: 10000,
    description: 'Complete solution for large clothing stores and chains',
    allowedFeatures: ['dashboard', 'inventory', 'pos', 'customers', 'purchases', 'bills', 'hr', 'leaves', 'salary', 'reports', 'settings', 'dropdownSettings', 'whatsapp', 'referrals'],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

async function initFeaturePlans() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const plansCollection = db.collection('plans')
    
    // Clear existing plans
    await plansCollection.deleteMany({})
    console.log('Cleared existing plans')
    
    // Insert new plans with feature permissions
    const result = await plansCollection.insertMany(defaultPlans)
    console.log(`Inserted ${result.insertedCount} plans with feature permissions`)
    
    // Display created plans
    const plans = await plansCollection.find({}).toArray()
    plans.forEach(plan => {
      console.log(`\n${plan.name} Plan:`)
      console.log(`  Price: ₹${plan.price}/month`)
      console.log(`  Max Users: ${plan.maxUsers}`)
      console.log(`  Max Products: ${plan.maxProducts}`)
      console.log(`  Allowed Features: ${plan.allowedFeatures.join(', ')}`)
    })
    
  } catch (error) {
    console.error('Error initializing feature plans:', error)
  } finally {
    await client.close()
  }
}

initFeaturePlans()