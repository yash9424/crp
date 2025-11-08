import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '30')

    const db = await connectDB()
    const salesCollection = db.collection(`sales_${session.user.tenantId}`)
    const inventoryCollection = db.collection(`products_${session.user.tenantId}`)

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
        return await getMonthlyNetProfit(salesCollection, inventoryCollection, startDate)
      
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

async function getDailySales(salesCollection: any, startDate: Date) {
  const today = new Date().toISOString().split('T')[0]
  
  const pipeline = [
    {
      $addFields: {
        dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
      }
    },
    {
      $group: {
        _id: "$dateStr",
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
  
  // Ensure today's data exists even if 0
  const todayData = results.find(r => r._id === today)
  if (!todayData) {
    results.push({
      _id: today,
      totalSales: 0,
      totalTransactions: 0,
      averageSale: 0
    })
  }
  
  return NextResponse.json(results)
}

async function getDailyProfit(salesCollection: any, inventoryCollection: any, startDate: Date) {
  const today = new Date().toISOString().split('T')[0]
  
  const pipeline = [
    {
      $unwind: "$items"
    },
    {
      $addFields: {
        dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
      }
    },
    {
      $group: {
        _id: {
          date: "$dateStr",
          productId: "$items.id"
        },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    }
  ]

  const salesData = await salesCollection.aggregate(pipeline).toArray()
  
  const dailyProfits: any = {}
  
  for (const item of salesData) {
    const date = item._id.date
    const profit = item.totalRevenue * 0.3 // Assume 30% profit margin
    
    if (!dailyProfits[date]) {
      dailyProfits[date] = { date, totalProfit: 0, totalRevenue: 0, totalCost: 0 }
    }
    
    dailyProfits[date].totalProfit += profit
    dailyProfits[date].totalRevenue += item.totalRevenue
    dailyProfits[date].totalCost += item.totalRevenue - profit
  }
  
  // Ensure today's data exists
  if (!dailyProfits[today]) {
    dailyProfits[today] = { date: today, totalProfit: 0, totalRevenue: 0, totalCost: 0 }
  }

  const results = Object.values(dailyProfits).sort((a: any, b: any) => a.date.localeCompare(b.date))
  return NextResponse.json(results)
}

async function getBestSellers(salesCollection: any, inventoryCollection: any, startDate: Date) {
  const pipeline = [
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
      $limit: 10
    }
  ]

  const results = await salesCollection.aggregate(pipeline).toArray()
  
  const enrichedResults = results.map(item => ({
    ...item,
    profit: item.totalRevenue * 0.3 // Assume 30% profit margin
  }))

  return NextResponse.json(enrichedResults)
}

async function getMonthlyNetProfit(salesCollection: any, inventoryCollection: any, startDate: Date) {
  const db = salesCollection.s.db
  const tenantId = salesCollection.collectionName.split('_')[1]
  const expensesCollection = db.collection(`tenant_${tenantId}_expenses`)
  
  const pipeline = [
    {
      $addFields: {
        monthStr: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
      }
    },
    {
      $group: {
        _id: "$monthStr",
        totalRevenue: { $sum: "$total" },
        totalTransactions: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]

  const salesData = await salesCollection.aggregate(pipeline).toArray()
  
  // Get monthly expenses
  const expensesPipeline = [
    {
      $addFields: {
        monthStr: { $dateToString: { format: "%Y-%m", date: "$date" } }
      }
    },
    {
      $group: {
        _id: "$monthStr",
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]
  
  const expensesData = await expensesCollection.aggregate(expensesPipeline).toArray()
  const expensesByMonth = expensesData.reduce((acc: any, expense: any) => {
    acc[expense._id] = expense.totalExpenses
    return acc
  }, {})
  
  const monthlyNetProfit = salesData.map((monthData: any) => {
    const grossProfit = monthData.totalRevenue * 0.3
    const expenses = expensesByMonth[monthData._id] || 0
    const netProfit = grossProfit - expenses

    return {
      month: monthData._id,
      monthName: new Date(monthData._id + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
      revenue: monthData.totalRevenue,
      grossProfit: grossProfit,
      cost: monthData.totalRevenue - grossProfit,
      expenses: expenses,
      netProfit: netProfit,
      profitMargin: monthData.totalRevenue > 0 ? (netProfit / monthData.totalRevenue) * 100 : 0
    }
  })

  return NextResponse.json(monthlyNetProfit)
}