import { connectDB } from './database'
import { FeatureKey, AVAILABLE_FEATURES } from './feature-permissions'
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
      console.log('No plan assigned to tenant, returning all features as fallback')
      return Object.keys(AVAILABLE_FEATURES) as FeatureKey[] // Allow all features as fallback
    }
    
    // Get plan's allowed features - handle plan as ObjectId
    let planQuery
    try {
      planQuery = { _id: new ObjectId(tenant.plan) }
    } catch {
      planQuery = { _id: tenant.plan }
    }
    
    const plan = await db.collection('plans').findOne(planQuery)
    console.log('Found plan:', plan)
    console.log('Plan query used:', planQuery)
    console.log('Tenant plan field:', tenant.plan)
    
    if (!plan) {
      console.log('Plan not found, returning all features as fallback')
      return Object.keys(AVAILABLE_FEATURES) as FeatureKey[] // Allow all features as fallback
    }
    
    if (!plan.allowedFeatures || plan.allowedFeatures.length === 0) {
      console.log('Plan has no allowedFeatures, returning default based on plan name')
      // Fallback based on plan name
      const planName = plan.name?.toLowerCase()
      if (planName?.includes('premium') || planName?.includes('pro')) {
        return Object.keys(AVAILABLE_FEATURES) as FeatureKey[]
      } else if (planName?.includes('standard')) {
        return ['dashboard', 'inventory', 'pos', 'customers', 'purchases', 'bills', 'hr', 'settings', 'dropdownSettings']
      } else {
        return ['dashboard', 'inventory', 'pos', 'customers', 'settings']
      }
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