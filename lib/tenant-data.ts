import { connectDB } from './database'

// Get tenant-specific database collection
export async function getTenantCollection(tenantId: string, collectionName: string) {
  const db = await connectDB()
  return db.collection(`tenant_${tenantId}_${collectionName}`)
}

// Initialize tenant data structure
export async function initializeTenantData(tenantId: string) {
  const collections = [
    'customers',
    'inventory',
    'purchases', 
    'sales',
    'employees',
    'reports',
    'settings'
  ]

  for (const collection of collections) {
    const tenantCollection = await getTenantCollection(tenantId, collection)
    
    // Create initial settings for tenant
    if (collection === 'settings') {
      await tenantCollection.insertOne({
        tenantId,
        storeName: '',
        currency: 'USD',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  }
}

// Clean up tenant data when tenant is deleted
export async function cleanupTenantData(tenantId: string) {
  const db = await connectDB()
  const collections = await db.listCollections().toArray()
  
  // Find and drop all collections that belong to this tenant
  for (const collection of collections) {
    if (collection.name.startsWith(`tenant_${tenantId}_`)) {
      await db.collection(collection.name).drop()
    }
  }
}