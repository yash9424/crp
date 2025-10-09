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
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '30')

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    switch (type) {
      case 'daily-sales':
        return await getDailySales(salesCollection, startDate)
      
      case 'daily-profit':
        return await getDailyProfit(salesCollection, inventoryCollection, startDate)
      
      case 'best-sellers':
        return await getBestSellers(salesCollection, inventoryCollection, startDate)
      
      case 'monthly-profit':
        return await getMonthlyNetProfit(salesCollection, inventoryCollection, expensesCollection, startDate)
      
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
})

async function getDailySales(salesCollection: any, startDate: Date) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        totalSales: { $sum: "$total" },
        totalTransactions: { $sum: 1 },
        averageSale: { $avg: "$total" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]

  const results = await salesCollection.aggregate(pipeline).toArray()
  return NextResponse.json(results)
}

async function getDailyProfit(salesCollection: any, inventoryCollection: any, startDate: Date) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          productId: "$items.id"
        },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    }
  ]

  const salesData = await salesCollection.aggregate(pipeline).toArray()
  
  // Get cost prices for profit calculation
  const productIds = [...new Set(salesData.map(item => item._id.productId))]
  const products = await inventoryCollection.find({
    _id: { $in: productIds.map(id => new ObjectId(id)) }
  }).toArray()

  const productCosts = products.reduce((acc: any, product: any) => {
    acc[product._id.toString()] = product.costPrice || 0
    return acc
  }, {})

  // Calculate daily profits
  const dailyProfits = salesData.reduce((acc: any, item: any) => {
    const date = item._id.date
    const costPrice = productCosts[item._id.productId] || 0
    const profit = item.totalRevenue - (costPrice * item.totalQuantity)

    if (!acc[date]) {
      acc[date] = { date, totalProfit: 0, totalRevenue: 0, totalCost: 0 }
    }

    acc[date].totalProfit += profit
    acc[date].totalRevenue += item.totalRevenue
    acc[date].totalCost += (costPrice * item.totalQuantity)

    return acc
  }, {})

  const results = Object.values(dailyProfits).sort((a: any, b: any) => a.date.localeCompare(b.date))
  return NextResponse.json(results)
}

async function getBestSellers(salesCollection: any, inventoryCollection: any, startDate: Date) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $group: {
        _id: "$items.id",
        productName: { $first: "$items.name" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        totalTransactions: { $sum: 1 }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    {
      $limit: 20
    }
  ]

  const results = await salesCollection.aggregate(pipeline).toArray()
  
  // Get additional product details
  const productIds = results.map(item => item._id)
  const products = await inventoryCollection.find({
    _id: { $in: productIds.map(id => new ObjectId(id)) }
  }).toArray()

  const productDetails = products.reduce((acc: any, product: any) => {
    acc[product._id.toString()] = product
    return acc
  }, {})

  const enrichedResults = results.map(item => ({
    ...item,
    product: productDetails[item._id] || {},
    profit: item.totalRevenue - ((productDetails[item._id]?.costPrice || 0) * item.totalQuantity)
  }))

  return NextResponse.json(enrichedResults)
}

async function getMonthlyNetProfit(salesCollection: any, inventoryCollection: any, expensesCollection: any, startDate: Date) {
  // Get monthly sales totals (revenue already includes profit)
  const salesPipeline = [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        totalRevenue: { $sum: "$total" },
        totalTransactions: { $sum: 1 }
      }
    }
  ]

  const salesData = await salesCollection.aggregate(salesPipeline).toArray()
  
  // Get detailed item data for cost calculation
  const itemsPipeline = [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          productId: "$items.id"
        },
        totalQuantity: { $sum: "$items.quantity" }
      }
    }
  ]

  const itemsData = await salesCollection.aggregate(itemsPipeline).toArray()
  
  // Get product costs
  const productIds = [...new Set(itemsData.map(item => item._id.productId))]
  const products = await inventoryCollection.find({
    _id: { $in: productIds.map(id => new ObjectId(id)) }
  }).toArray()

  const productCosts = products.reduce((acc: any, product: any) => {
    acc[product._id.toString()] = product.costPrice || 0
    return acc
  }, {})

  // Calculate monthly costs
  const monthlyCosts = itemsData.reduce((acc: any, item: any) => {
    const month = item._id.month
    const costPrice = productCosts[item._id.productId] || 0
    const totalCost = costPrice * item.totalQuantity

    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += totalCost
    return acc
  }, {})

  // Calculate monthly gross profit
  const monthlyGrossProfit = salesData.reduce((acc: any, item: any) => {
    const month = item._id
    const cost = monthlyCosts[month] || 0
    const grossProfit = item.totalRevenue - cost

    acc[month] = {
      month,
      revenue: item.totalRevenue,
      cost: cost,
      grossProfit: grossProfit
    }

    return acc
  }, {})

  // Get monthly expenses
  const expensesPipeline = [
    {
      $match: {
        $or: [
          { date: { $gte: startDate } },
          { createdAt: { $gte: startDate } }
        ]
      }
    },
    {
      $addFields: {
        expenseDate: {
          $ifNull: ["$date", "$createdAt"]
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate" } },
        totalExpenses: { $sum: "$amount" },
        expenseCount: { $sum: 1 }
      }
    }
  ]

  // Debug: Check raw expense data first
  const allExpenses = await expensesCollection.find({ date: { $gte: startDate } }).toArray()
  console.log('Raw expenses found:', allExpenses.length)
  console.log('Sample expense:', allExpenses[0])
  
  const expensesData = await expensesCollection.aggregate(expensesPipeline).toArray()
  
  console.log('Monthly expenses data:', expensesData)
  console.log('Monthly gross profit:', Object.keys(monthlyGrossProfit))
  console.log('Start date for query:', startDate)
  
  // Create expense lookup by month
  const expensesByMonth = expensesData.reduce((acc: any, expense: any) => {
    acc[expense._id] = expense.totalExpenses
    return acc
  }, {})

  // Combine profit and expenses for net profit
  const monthlyNetProfit = Object.values(monthlyGrossProfit).map((monthData: any) => {
    const expenses = expensesByMonth[monthData.month] || 0
    const netProfit = monthData.grossProfit - expenses

    return {
      month: monthData.month,
      monthName: new Date(monthData.month + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
      revenue: monthData.revenue,
      grossProfit: monthData.grossProfit,
      cost: monthData.cost,
      expenses: expenses,
      netProfit: netProfit,
      profitMargin: monthData.revenue > 0 ? (netProfit / monthData.revenue) * 100 : 0
    }
  })

  // Also include months that have only expenses (no sales)
  expensesData.forEach((expenseData: any) => {
    const month = expenseData._id
    const existingMonth = monthlyNetProfit.find((m: any) => m.month === month)
    
    if (!existingMonth) {
      monthlyNetProfit.push({
        month: month,
        monthName: new Date(month + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
        revenue: 0,
        grossProfit: 0,
        expenses: expenseData.totalExpenses,
        netProfit: -expenseData.totalExpenses,
        profitMargin: 0
      })
    }
  })

  // Sort by month descending
  monthlyNetProfit.sort((a, b) => b.month.localeCompare(a.month))

  return NextResponse.json(monthlyNetProfit)
}