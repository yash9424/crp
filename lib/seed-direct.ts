import { getTenantsCollection, getUsersCollection } from './database'

async function main() {
  console.log('🌱 Seeding MongoDB database...')

  const tenantsCollection = await getTenantsCollection()
  const usersCollection = await getUsersCollection()

  // Clear existing data
  await tenantsCollection.deleteMany({})
  await usersCollection.deleteMany({})

  // Create sample tenants
  const tenants = await tenantsCollection.insertMany([
    {
      name: 'Fashion Forward Store',
      email: 'admin@fashionforward.com',
      phone: '+1-555-0101',
      address: '123 Fashion St, New York, NY 10001',
      plan: 'pro',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Urban Style Boutique',
      email: 'contact@urbanstyle.com',
      phone: '+1-555-0102',
      address: '456 Style Ave, Los Angeles, CA 90210',
      plan: 'basic',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Elite Fashion House',
      email: 'info@elitefashion.com',
      phone: '+1-555-0103',
      address: '789 Luxury Blvd, Miami, FL 33101',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])

  const tenant1Id = tenants.insertedIds[0].toString()

  // Create users
  await usersCollection.insertMany([
    {
      email: 'superadmin@erp.com',
      password: 'password123',
      name: 'Super Admin',
      role: 'super-admin',
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      email: 'tenant@store.com',
      password: 'password123',
      name: 'Store Owner',
      role: 'tenant-admin',
      tenantId: tenant1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])

  console.log('✅ MongoDB database seeded successfully!')
  console.log('📊 Database: erp_system')
  console.log('📋 Collections: tenants, users')
  console.log('👥 Sample data: 3 tenants, 2 users')
  
  process.exit(0)
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e)
  process.exit(1)
})