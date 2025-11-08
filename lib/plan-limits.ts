import { connectDB } from './database'
import { getTenantCollection } from './tenant-data'
import { ObjectId } from 'mongodb'

export interface PlanLimits {
  maxProducts: number
  maxUsers: number
  currentProducts: number
  currentUsers: number
  planName: string
}

export async function getTenantPlanLimits(tenantId: string): Promise<PlanLimits | null> {
  try {
    const db = await connectDB()
    
    // Get tenant's plan
    let tenantQuery
    try {
      tenantQuery = { _id: new ObjectId(tenantId) }
    } catch {
      tenantQuery = { _id: tenantId }
    }
    
    const tenant = await db.collection('tenants').findOne(tenantQuery)
    
    if (!tenant?.plan) {
      return null
    }
    
    // Get plan details - handle both ObjectId and string references
    let planQuery
    try {
      // Try as ObjectId first
      planQuery = { _id: new ObjectId(tenant.plan) }
    } catch {
      // If not ObjectId, try as string or direct match
      planQuery = { _id: tenant.plan }
    }
    
    let plan = await db.collection('plans').findOne(planQuery)
    
    // If not found by _id, try by name (fallback)
    if (!plan && typeof tenant.plan === 'string') {
      plan = await db.collection('plans').findOne({ name: { $regex: new RegExp(tenant.plan, 'i') } })
    }
    
    if (!plan) {
      console.log('Plan not found for tenant:', tenantId, 'plan reference:', tenant.plan)
      return {
        maxProducts: 10,
        maxUsers: 5,
        currentProducts: 0,
        currentUsers: 0,
        planName: 'Basic Plan'
      }
    }
    
    // Get current product count
    const inventoryCollection = await getTenantCollection(tenantId, 'inventory')
    const currentProducts = await inventoryCollection.countDocuments({})
    
    // Get current user count
    const currentUsers = await db.collection('users').countDocuments({ tenantId })
    
    return {
      maxProducts: plan.maxProducts || 0,
      maxUsers: plan.maxUsers || 0,
      currentProducts,
      currentUsers,
      planName: plan.name || 'Unknown Plan'
    }
  } catch (error) {
    console.error('Error getting tenant plan limits:', error)
    return null
  }
}

export async function checkProductLimit(tenantId: string): Promise<{
  canAdd: boolean
  message?: string
  limits?: PlanLimits
}> {
  try {
    const limits = await getTenantPlanLimits(tenantId)
    
    if (!limits) {
      return { canAdd: true }
    }
    
    if (limits.currentProducts >= limits.maxProducts) {
      return {
        canAdd: false,
        message: `Product limit reached! Your ${limits.planName} plan allows ${limits.maxProducts} products. You currently have ${limits.currentProducts} products.`,
        limits
      }
    }
    
    return { canAdd: true, limits }
  } catch (error) {
    console.error('Error checking product limit:', error)
    return { canAdd: true }
  }
}

export async function checkUserLimit(tenantId: string): Promise<{
  canAdd: boolean
  message?: string
  limits?: PlanLimits
}> {
  try {
    const limits = await getTenantPlanLimits(tenantId)
    
    if (!limits) {
      return { canAdd: true }
    }
    
    if (limits.currentUsers >= limits.maxUsers) {
      return {
        canAdd: false,
        message: `User limit reached! Your ${limits.planName} plan allows ${limits.maxUsers} users. You currently have ${limits.currentUsers} users.`,
        limits
      }
    }
    
    return { canAdd: true, limits }
  } catch (error) {
    console.error('Error checking user limit:', error)
    return { canAdd: true }
  }
}