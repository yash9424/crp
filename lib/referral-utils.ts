import clientPromise from '@/lib/mongodb'

export function generateReferralCode(tenantName: string): string {
  const prefix = tenantName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

export async function createReferralRecord(data: {
  referralCode: string
  referrerShop: string
  referredShop: string
  referredEmail: string
  planType: string
  reward: number
}) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    
    const referralRecord = {
      ...data,
      status: 'Completed',
      dateReferred: new Date().toISOString().split('T')[0],
      dateCompleted: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('referrals').insertOne(referralRecord)
    return true
  } catch (error) {
    console.error('Failed to create referral record:', error)
    return false
  }
}

export function calculateReward(plan: string): number {
  switch (plan.toLowerCase()) {
    case 'enterprise':
      return 499
    case 'pro':
    case 'professional':
      return 299
    case 'basic':
    default:
      return 199
  }
}

export async function findReferrerByCode(referralCode: string) {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    
    // Find tenant whose referral code matches the provided code
    const tenant = await db.collection('tenants').findOne({ 
      referralCode: referralCode 
    })
    
    return tenant ? tenant.name : 'Unknown Referrer'
  } catch (error) {
    console.error('Failed to find referrer:', error)
    return 'Unknown Referrer'
  }
}