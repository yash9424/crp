"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Star,
  BarChart3
} from "lucide-react"
import { AlertLogs } from "@/components/alert-logs"

interface DashboardData {
  todaySales: number
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  stockValue: number
  lowStockItems: Array<{
    name: string
    stock: number
    minStock: number
  }>
  topCustomer: {
    name: string
    totalPurchases: number
    totalSpent: number
  }
  topCustomers?: Array<{
    name: string
    totalPurchases: number
    totalSpent: number
  }>
  salesTrend: number
  weeklyData: Array<{
    day: string
    sales: number
    orders: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ChartDashboard() {
  const [data, setData] = useState<DashboardData>({
    todaySales: 0,
    topProducts: [],
    stockValue: 0,
    lowStockItems: [],
    topCustomer: { name: "No data", totalPurchases: 0, totalSpent: 0 },
    topCustomers: [],
    salesTrend: 0,
    weeklyData: []
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/analytics', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const analyticsData = await response.json()
        
        // Generate weekly data based on real today's data
        const weeklyData = [
          { day: 'Mon', sales: 0, orders: 0 },
          { day: 'Tue', sales: 0, orders: 0 },
          { day: 'Wed', sales: 0, orders: 0 },
          { day: 'Thu', sales: 0, orders: 0 },
          { day: 'Fri', sales: 0, orders: 0 },
          { day: 'Sat', sales: 0, orders: 0 },
          { day: 'Sun', sales: analyticsData.todaySales, orders: analyticsData.additionalMetrics?.todayOrders || 0 }
        ]

        setData({
          todaySales: analyticsData.todaySales,
          topProducts: analyticsData.topProducts,
          stockValue: analyticsData.stockValue,
          lowStockItems: analyticsData.lowStockItems,
          topCustomer: analyticsData.topCustomer,
          topCustomers: analyticsData.topCustomers || [],
          salesTrend: analyticsData.salesTrend,
          weeklyData
        })
        setLastUpdated(new Date())
      } else {
        console.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Smart Insights Dashboard</h2>
        <div className="ml-auto flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Today's Sales</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{formatCurrency(data.todaySales)}</div>
            <div className="flex items-center text-xs text-green-600 mt-2">
              {data.salesTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1 rotate-180" />
              )}
              {Math.abs(data.salesTrend).toFixed(1)}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Stock Value</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{formatCurrency(data.stockValue)}</div>
            <div className="text-xs text-blue-600 mt-2">Total inventory worth</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{data.lowStockItems.length}</div>
            <div className="text-xs text-red-600 mt-2">Items need restocking</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span>Top 3 Customers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topCustomers && data.topCustomers.length > 0 ? (
              data.topCustomers.map((customer, index) => (
                <div key={`customer-${index}-${customer.name}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.totalPurchases} purchases</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(customer.totalSpent)}</div>
                    <Badge className={`text-xs ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No customer purchase data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Weekly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Sales']} />
                <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topProducts.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Quantity']} />
                <Bar dataKey="quantity" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Product Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((product, index) => (
                <div key={`product-${index}-${product.name}`} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.quantity} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(product.revenue)}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Critical Stock Levels</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {data.lowStockItems.slice(0, 8).map((item, index) => (
                <div key={`stock-${index}-${item.name}`} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">Min: {item.minStock || 10}</div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {item.stock} left
                  </Badge>
                </div>
              ))}
              {data.lowStockItems.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  All items are well stocked!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert Logs */}
        <AlertLogs />

      </div>
    </div>
  )
}