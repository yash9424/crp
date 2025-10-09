"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  Star,
} from "lucide-react"

const salesData = [
  { day: "Mon", sales: 2400, orders: 12 },
  { day: "Tue", sales: 1800, orders: 9 },
  { day: "Wed", sales: 3200, orders: 16 },
  { day: "Thu", sales: 2800, orders: 14 },
  { day: "Fri", sales: 4100, orders: 21 },
  { day: "Sat", sales: 3800, orders: 19 },
  { day: "Sun", sales: 2200, orders: 11 },
]

// Updated top products for clothing store
const topProducts = [
  { name: "Men's Cotton T-Shirt", sales: 85, revenue: 2125 },
  { name: "Women's Denim Jeans", sales: 42, revenue: 2730 },
  { name: "Summer Dress", sales: 38, revenue: 1444 },
  { name: "Formal Dress Shirt", sales: 55, revenue: 2475 },
  { name: "Leather Jacket", sales: 12, revenue: 1440 },
]

// Updated low stock items for clothing store
const lowStockItems = [
  { name: "Men's Cotton T-Shirt (L)", stock: 3, minStock: 10, category: "T-Shirts" },
  { name: "Women's Denim Jeans (M)", stock: 2, minStock: 8, category: "Jeans" },
  { name: "Leather Jacket (XL)", stock: 1, minStock: 5, category: "Jackets" },
  { name: "Summer Dress (S)", stock: 4, minStock: 12, category: "Dresses" },
]

const expenseCategories = [
  { name: "Rent", value: 3500, color: "#3b82f6" },
  { name: "Utilities", value: 800, color: "#10b981" },
  { name: "Marketing", value: 1200, color: "#f59e0b" },
  { name: "Staff", value: 4500, color: "#ef4444" },
  { name: "Inventory", value: 12000, color: "#8b5cf6" },
]

export default function TenantDashboard() {
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    recentSales: [],
    topProducts: [],
    lowStockItems: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch sales data
      const salesResponse = await fetch('/api/pos/sales')
      const sales = salesResponse.ok ? await salesResponse.json() : []
      
      // Fetch products data
      const productsResponse = await fetch('/api/pos/products')
      const products = productsResponse.ok ? await productsResponse.json() : []
      
      // Fetch customers data
      const customersResponse = await fetch('/api/customers')
      const customers = customersResponse.ok ? await customersResponse.json() : []
      
      // Calculate today's data
      const today = new Date().toDateString()
      const todaySales = sales.filter((sale: any) => 
        new Date(sale.createdAt).toDateString() === today
      )
      
      const todayRevenue = todaySales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0)
      
      // Calculate low stock items
      const lowStock = products.filter((product: any) => product.stock < 10)
      
      // Get top products from recent sales
      const productSales: any = {}
      sales.forEach((sale: any) => {
        sale.items?.forEach((item: any) => {
          if (productSales[item.name]) {
            productSales[item.name].quantity += item.quantity
            productSales[item.name].revenue += item.total || 0
          } else {
            productSales[item.name] = {
              name: item.name,
              quantity: item.quantity,
              revenue: item.total || 0
            }
          }
        })
      })
      
      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 5)
      
      setDashboardData({
        todaySales: todayRevenue,
        todayOrders: todaySales.length,
        totalCustomers: customers.length,
        lowStockCount: lowStock.length,
        recentSales: sales.slice(0, 5),
        topProducts,
        lowStockItems: lowStock.slice(0, 4)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout title="Dashboard" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Dashboard" userRole="tenant-admin">
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Today's Sales</CardTitle>
              <span className="h-4 w-4 text-muted-foreground  text-xl">₹</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {dashboardData.todaySales.toFixed(2)}</div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Orders Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.todayOrders}</div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{dashboardData.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs attention
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalCustomers}</div>

            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers based on sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product: any, index: number) => (
                <div key={product.name} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">#{index + 1}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.quantity} units • ₹{product.revenue.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{product.quantity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Low Stock Alert</span>
            </CardTitle>
            <CardDescription>Items that need immediate restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.lowStockItems.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category || 'Product'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="destructive" className="text-xs">
                      {item.stock} left
                    </Badge>
                    <p className="text-xs text-muted-foreground">Low Stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentSales.map((sale: any) => (
                <div key={sale._id || sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Bill #{sale.billNo}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.customerName} • {sale.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">₹{(sale.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


      </div>
    </MainLayout>
  )
}
