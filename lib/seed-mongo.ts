import { prisma } from './prisma'

async function main() {
  console.log('🌱 Seeding MongoDB database...')

  // Clear existing data
  await prisma.user.deleteMany({})
  await prisma.tenant.deleteMany({})

  // Create sample tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Fashion Forward Store',
      email: 'admin@fashionforward.com',
      phone: '+1-555-0101',
      address: '123 Fashion St, New York, NY 10001',
      plan: 'pro',
      status: 'active'
    }
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Urban Style Boutique',
      email: 'contact@urbanstyle.com',
      phone: '+1-555-0102',
      address: '456 Style Ave, Los Angeles, CA 90210',
      plan: 'basic',
      status: 'active'
    }
  })

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Elite Fashion House',
      email: 'info@elitefashion.com',
      phone: '+1-555-0103',
      address: '789 Luxury Blvd, Miami, FL 33101',
      plan: 'enterprise',
      status: 'active'
    }
  })

  // Create users
  await prisma.user.create({
    data: {
      email: 'superadmin@erp.com',
      password: 'password123',
      name: 'Super Admin',
      role: 'super-admin'
    }
  })

  await prisma.user.create({
    data: {
      email: 'tenant@store.com',
      password: 'password123',
      name: 'Store Owner',
      role: 'tenant-admin',
      tenantId: tenant1.id
    }
  })

  await prisma.user.create({
    data: {
      email: 'manager@urbanstyle.com',
      password: 'password123',
      name: 'Store Manager',
      role: 'tenant-admin',
      tenantId: tenant2.id
    }
  })

  console.log('✅ MongoDB database seeded successfully!')
  console.log('📊 Database: erp_system')
  console.log('📋 Collections: User, Tenant')
  console.log('👥 Sample data: 3 tenants, 3 users')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })