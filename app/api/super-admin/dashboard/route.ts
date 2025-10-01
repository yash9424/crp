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
    
    // Generate revenue data for last 6 months
    const revenueData = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    for (let i = 0; i < 6; i++) {
      revenueData.push({
        month: months[i],
        revenue: Math.floor(Math.random() * 20000) + 45000,
        subscriptions: Math.floor(Math.random() * 50) + 120
      })
    }
    
    // Generate signup data for last 7 days
    const signupData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (let i = 0; i < 7; i++) {
      signupData.push({
        day: days[i],
        signups: Math.floor(Math.random() * 20) + 5
      })
    }
    
    // Plan distribution (mock data)
    const planDistribution = [
      { name: "Basic", value: 45, color: "#3b82f6" },
      { name: "Pro", value: 35, color: "#10b981" },
      { name: "Enterprise", value: 20, color: "#f59e0b" }
    ]
    
    // Recent activities
    const recentActivities = await db.collection('tenants')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    
    const activities = recentActivities.map(tenant => ({
      type: 'New Registration',
      description: `${tenant.name} registered`,
      time: tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : 'Recently',
      status: 'New'
    }))
    
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