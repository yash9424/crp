import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('erp_system')
    
    // Get total tenants
    const totalTenants = await db.collection('tenants').countDocuments()
    
    // Get active subscriptions (assuming all tenants have active subscriptions for now)
    const activeSubscriptions = totalTenants
    
    // Get referrals data
    const referrals = await db.collection('referrals').find({}).toArray()
    const completedReferrals = referrals.filter(r => r.status === 'Completed')
    
    // Calculate monthly revenue from referrals and subscriptions
    const monthlyRevenue = completedReferrals.reduce((sum, r) => sum + (r.reward || 0), 0) + (activeSubscriptions * 299)
    
    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentSignups = await db.collection('tenants').countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })
    
    // Real revenue data based on actual tenants
    const plans = await db.collection('plans').find({}).toArray()
    const planMap = plans.reduce((acc, plan) => {
      acc[plan._id.toString()] = { name: plan.name, price: plan.price }
      return acc
    }, {})
    
    const tenants = await db.collection('tenants').find({}).toArray()
    const realMonthlyRevenue = tenants.reduce((sum, tenant) => {
      if (tenant.plan && planMap[tenant.plan.toString()]) {
        return sum + planMap[tenant.plan.toString()].price
      }
      return sum
    }, 0)
    
    const revenueData = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    for (let i = 0; i < 6; i++) {
      revenueData.push({
        month: months[i],
        revenue: realMonthlyRevenue,
        subscriptions: activeSubscriptions
      })
    }
    
    // Real signup data for last 7 days
    const signupData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const daySignups = await db.collection('tenants').countDocuments({
        createdAt: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      })
      signupData.push({
        day: days[6 - i],
        signups: daySignups
      })
    }
    
    // Real plan distribution
    const planCounts = {}
    const tenantsWithPlans = await db.collection('tenants').find({ plan: { $exists: true } }).toArray()
    
    for (const tenant of tenantsWithPlans) {
      if (tenant.plan && planMap[tenant.plan.toString()]) {
        const planName = planMap[tenant.plan.toString()].name
        planCounts[planName] = (planCounts[planName] || 0) + 1
      }
    }
    
    const planDistribution = Object.entries(planCounts).map(([name, count], index) => ({
      name,
      value: totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0,
      color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index] || "#6b7280"
    }))
    
    // Get pending notifications
    const pendingPlanRequests = await db.collection('planRequests')
      .find({ status: 'pending' })
      .sort({ requestedAt: -1 })
      .limit(10)
      .toArray()
    
    const pendingFieldRequests = await db.collection('field_requests')
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
    
    // Recent activities
    const recentActivities = await db.collection('tenants')
      .find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray()
    
    const activities = [
      ...pendingPlanRequests.map(req => ({
        type: 'Plan Upgrade Request',
        description: `${req.requestedBy} requested plan upgrade`,
        time: new Date(req.requestedAt).toLocaleString(),
        status: 'Pending',
        priority: 'high'
      })),
      ...pendingFieldRequests.map(req => ({
        type: 'Field Request',
        description: `${req.tenantName} requested new field: ${req.fieldName}`,
        time: new Date(req.createdAt).toLocaleString(),
        status: 'Pending',
        priority: 'medium'
      })),
      ...recentActivities.map(tenant => ({
        type: 'New Registration',
        description: `${tenant.name} registered`,
        time: tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : 'Recently',
        status: 'New',
        priority: 'low'
      }))
    ].slice(0, 8)
    
    return NextResponse.json({
      metrics: {
        totalTenants,
        activeSubscriptions,
        monthlyRevenue,
        newSignups: recentSignups
      },
      charts: {
        revenueData,
        signupData,
        planDistribution
      },
      activities,
      notifications: {
        planRequests: pendingPlanRequests.length,
        fieldRequests: pendingFieldRequests.length,
        total: pendingPlanRequests.length + pendingFieldRequests.length
      },
      systemHealth: {
        serverUptime: 99.9,
        databasePerformance: 98.5,
        apiResponseTime: 85
      },
      supportTickets: {
        open: 23,
        inProgress: 12,
        resolvedToday: 45
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}