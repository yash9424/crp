import { prisma } from './prisma'

async function main() {
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

  console.log('MongoDB Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })