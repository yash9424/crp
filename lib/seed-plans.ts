import { connectDB } from './database'

async function main() {
  console.log('🌱 Seeding plans data...')

  const db = await connectDB()
  const plansCollection = db.collection('plans')

  // Clear existing plans
  await plansCollection.deleteMany({})

  // Create sample plans
  await plansCollection.insertMany([
    {
      name: 'Basic',
      price: 999,
      features: ['POS System', 'Basic Inventory', 'Customer Management', 'Basic Reports'],
      maxUsers: 3,
      maxProducts: 500,
      description: 'Perfect for small clothing stores just getting started',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Pro',
      price: 2499,
      features: ['Advanced POS', 'Full Inventory', 'Customer Management', 'Advanced Reports', 'WhatsApp Integration', 'Staff Management'],
      maxUsers: 10,
      maxProducts: 2000,
      description: 'Ideal for growing fashion businesses with multiple staff',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Enterprise',
      price: 4999,
      features: ['Complete POS Suite', 'Unlimited Inventory', 'Advanced CRM', 'Analytics Dashboard', 'Multi-location', 'API Access', 'Priority Support'],
      maxUsers: 50,
      maxProducts: 10000,
      description: 'Complete solution for large fashion retailers and chains',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])

  console.log('✅ Plans seeded successfully!')
  console.log('📊 Created 3 subscription plans')
  
  process.exit(0)
}

main().catch((e) => {
  console.error('❌ Plans seeding failed:', e)
  process.exit(1)
})