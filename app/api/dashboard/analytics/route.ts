import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      // Return default data for unauthenticated users
      return NextResponse.json({
        todaySales: 0,
        salesTrend: 0,
        topProducts: [],
        stockValue: 0,
        lowStockItems: [],
        topCustomer: { name: "No customers", totalPurchases: 0, totalSpent: 0 },
        topCustomers: [],
        additionalMetrics: {
          totalCustomers: 0,
          totalProducts: 0,
          todayOrders: 0,
          lowStockCount: 0
        }
      })
    }

    const db = await connectDB()
    const tenantId = session.user.tenantId

    // Get collections
    const salesCollection = db.collection(`sales_${tenantId}`)
    const productsCollection = db.collection(`products_${tenantId}`)
    const customersCollection = db.collection(`customers_${tenantId}`)

    // Calculate date ranges
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterday = new Date(startOfToday)
    yesterday.setDate(yesterday.getDate() - 1)

    // Today's sales
    const todaySales = await salesCollection.find({
      createdAt: { $gte: startOfToday }
    }).toArray()

    const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0)

    // Yesterday's sales for trend calculation
    const yesterdaySales = await salesCollection.find({
      createdAt: { 
        $gte: yesterday,
        $lt: startOfToday
      }
    }).toArray()

    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const salesTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    // Get all sales for product analysis
    const allSales = await salesCollection.find({}).sort({ createdAt: -1 }).limit(1000).toArray()

    // Calculate top products
    const productSales: any = {}
    allSales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        if (productSales[item.name]) {
          productSales[item.name].quantity += item.quantity || 0
          productSales[item.name].revenue += (item.quantity || 0) * (item.price || 0)
        } else {
          productSales[item.name] = {
            name: item.name,
            quantity: item.quantity || 0,
            revenue: (item.quantity || 0) * (item.price || 0)
          }
        }
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5)

    // Get tenant field configuration
    const tenantFieldsCollection = db.collection('tenant_fields')
    const tenantConfig = await tenantFieldsCollection.findOne({ tenantId })
    
    // Get products for stock analysis
    const products = await productsCollection.find({}).toArray()
    
    // Calculate stock value
    const stockValue = products.reduce((sum, product) => 
      sum + ((product.stock || 0) * (product.price || 0)), 0
    )

    // Helper function to get product name from dynamic fields
    const getProductName = (product: any) => {
      if (tenantConfig?.fields) {
        const nameField = tenantConfig.fields.find((f: any) => 
          f.enabled && (f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('product'))
        )
        if (nameField) {
          const fieldKey = nameField.name.toLowerCase().replace(/\s+/g, '_')
          return product[fieldKey] || product[nameField.name] || product[nameField.name.toLowerCase()]
        }
      }
      return product.name || product.productname || product.product_name || product['Product Name'] || 'Unnamed Product'
    }

    // Get low stock items
    const lowStockItems = products
      .filter(product => (Number(product.stock) || 0) <= (Number(product.minStock || product.min_stock) || 0) && (Number(product.minStock || product.min_stock) || 0) > 0)
      .map(product => ({
        name: getProductName(product),
        stock: Number(product.stock) || 0,
        minStock: Number(product.minStock || product.min_stock || product['Min Stock']) || 0
      }))
      .slice(0, 10)

    // Find top 3 customers
    const customerPurchases: any = {}
    allSales.forEach(sale => {
      if (sale.customerName && sale.customerName !== 'Walk-in Customer') {
        if (customerPurchases[sale.customerName]) {
          customerPurchases[sale.customerName].totalPurchases += 1
          customerPurchases[sale.customerName].totalSpent += sale.total || 0
        } else {
          customerPurchases[sale.customerName] = {
            name: sale.customerName,
            totalPurchases: 1,
            totalSpent: sale.total || 0
          }
        }
      }
    })

    const topCustomers = Object.values(customerPurchases)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 3)

    const topCustomer = topCustomers[0] || { name: "No customers", totalPurchases: 0, totalSpent: 0 }

    // Additional metrics
    const totalCustomers = await customersCollection.countDocuments()
    const totalProducts = products.length

    return NextResponse.json({
      todaySales: todayRevenue,
      salesTrend,
      topProducts,
      stockValue,
      lowStockItems,
      topCustomer,
      topCustomers,
      additionalMetrics: {
        totalCustomers,
        totalProducts,
        todayOrders: todaySales.length,
        lowStockCount: lowStockItems.length
      }
    })

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    // Return default data on error
    return NextResponse.json({
      todaySales: 0,
      salesTrend: 0,
      topProducts: [],
      stockValue: 0,
      lowStockItems: [],
      topCustomer: { name: "No customers", totalPurchases: 0, totalSpent: 0 },
      topCustomers: [],
      additionalMetrics: {
        totalCustomers: 0,
        totalProducts: 0,
        todayOrders: 0,
        lowStockCount: 0
      }
    })
  }
}