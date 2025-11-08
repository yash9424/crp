import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'
import { ObjectId } from 'mongodb'

export const GET = withFeatureAccess('reports')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))

    // Current period data
    const currentPeriodSales = await salesCollection.find({
      createdAt: { $gte: startDate }
    }).toArray()

    // Previous period data for comparison
    const previousPeriodSales = await salesCollection.find({
      createdAt: { 
        $gte: previousStartDate,
        $lt: startDate
      }
    }).toArray()

    // Calculate current period metrics
    const totalRevenue = currentPeriodSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const totalTransactions = currentPeriodSales.length

    // Calculate previous period metrics
    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

    // Calculate profit for current period
    let totalProfit = 0
    const productSales = new Map()

    for (const sale of currentPeriodSales) {
      for (const item of sale.items || []) {
        const key = item.id
        if (!productSales.has(key)) {
          productSales.set(key, {
            id: key,
            name: item.name,
            quantity: 0,
            revenue: 0
          })
        }
        
        const product = productSales.get(key)
        product.quantity += item.quantity
        product.revenue += (item.price * item.quantity)
      }
    }

    // Get cost prices for profit calculation
    const productIds = Array.from(productSales.keys())
    const products = await inventoryCollection.find({
      _id: { $in: productIds.map(id => new ObjectId(id)) }
    }).toArray()

    const productCosts = products.reduce((acc: any, product: any) => {
      acc[product._id.toString()] = product.costPrice || 0
      return acc
    }, {})

    // Get expenses for the current period
    const currentExpenses = await expensesCollection.find({
      date: { $gte: startDate }
    }).toArray()
    
    const totalExpenses = currentExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

    // Calculate total profit and top products
    const topProducts = []
    for (const [productId, productData] of productSales) {
      const costPrice = productCosts[productId] || 0
      const profit = productData.revenue - (costPrice * productData.quantity)
      totalProfit += profit

      topProducts.push({
        name: productData.name,
        quantity: productData.quantity,
        revenue: productData.revenue,
        profit
      })
    }
    
    // Subtract business expenses from total profit
    totalProfit -= totalExpenses

    // Sort top products by revenue
    topProducts.sort((a, b) => b.revenue - a.revenue)

    // Calculate growth rates
    const salesGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Get previous period expenses
    const previousExpenses = await expensesCollection.find({
      date: { 
        $gte: previousStartDate,
        $lt: startDate
      }
    }).toArray()
    
    const previousTotalExpenses = previousExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

    // Calculate previous period profit for growth comparison
    let previousProfit = 0
    for (const sale of previousPeriodSales) {
      for (const item of sale.items || []) {
        const costPrice = productCosts[item.id] || 0
        previousProfit += (item.price * item.quantity) - (costPrice * item.quantity)
      }
    }
    
    // Subtract previous period expenses
    previousProfit -= previousTotalExpenses

    const profitGrowth = previousProfit > 0 
      ? ((totalProfit - previousProfit) / previousProfit) * 100 
      : 0

    const summary = {
      totalRevenue,
      totalProfit,
      totalExpenses,
      totalTransactions,
      profitMargin,
      topProducts: topProducts.slice(0, 10),
      recentTrends: {
        salesGrowth,
        profitGrowth
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Summary analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch summary analytics' }, { status: 500 })
  }
})