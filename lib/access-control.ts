import { connectDB } from './database'
import { FeatureKey } from './feature-permissions'
import { ObjectId } from 'mongodb'

export async function getTenantFeatures(tenantId: string): Promise<FeatureKey[]> {
  try {
    const db = await connectDB()
    
    console.log('Getting features for tenant:', tenantId)
    
    // Get tenant's plan - handle both string and ObjectId
    let tenantQuery
    try {
      tenantQuery = { _id: new ObjectId(tenantId) }
    } catch {
      tenantQuery = { _id: tenantId }
    }
    
    const tenant = await db.collection('tenants').findOne(tenantQuery)
    console.log('Found tenant:', tenant)
    
    if (!tenant?.plan) {
      console.log('No plan assigned to tenant, returning default features')
      return ['dashboard'] // Default minimal access
    }
    
    // Get plan's allowed features - handle plan as ObjectId
    const plan = await db.collection('plans').findOne({ _id: tenant.plan })
    console.log('Found plan:', plan)
    
    if (!plan?.allowedFeatures) {
      console.log('Plan has no allowedFeatures, returning default')
      return ['dashboard'] // Default minimal access
    }
    
    console.log('Returning features:', plan.allowedFeatures)
    return plan.allowedFeatures
  } catch (error) {
    console.error('Error getting tenant features:', error)
    return ['dashboard'] // Default minimal access
  }
}

export async function hasFeatureAccess(tenantId: string, feature: FeatureKey): Promise<boolean> {
  const allowedFeatures = await getTenantFeatures(tenantId)
  return allowedFeatures.includes(feature)
}

export function createAccessMiddleware(requiredFeature: FeatureKey) {
  return async (tenantId: string) => {
    const hasAccess = await hasFeatureAccess(tenantId, requiredFeature)
    if (!hasAccess) {
      throw new Error(`Access denied: ${requiredFeature} feature not available in your plan`)
    }
    return true
  }
}