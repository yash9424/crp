"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Receipt, Search, Download, Eye, TrendingUp, DollarSign, Package, Calendar } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { SimpleChart } from "@/components/simple-chart"

interface Sale {
  id: string
  billNo: string
  customerName: string
  customerPhone?: string
  items: any[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  cashier: string
  createdAt: string
}

interface DailySales {
  _id: string
  totalSales: number
  totalTransactions: number
  averageSale: number
}

interface DailyProfit {
  date: string
  totalProfit: number
  totalRevenue: number
  totalCost: number
}

interface BestSeller {
  _id: string
  productName: string
  totalQuantity: number
  totalRevenue: number
  totalTransactions: number
  profit: number
  product: any
}

interface MonthlyNetProfit {
  month: string
  monthName: string
  revenue: number
  grossProfit: number
  expenses: number
  netProfit: number
  profitMargin: number
}

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [dailyProfit, setDailyProfit] = useState<DailyProfit[]>([])
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [monthlyNetProfit, setMonthlyNetProfit] = useState<MonthlyNetProfit[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState("30")
  const [summaryData, setSummaryData] = useState<any>(null)

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/pos/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const [salesRes, profitRes, sellersRes, monthlyRes] = await Promise.all([
        fetch(`/api/analytics?type=daily-sales&days=${dateRange}`),
        fetch(`/api/analytics?type=daily-profit&days=${dateRange}`),
        fetch(`/api/analytics?type=best-sellers&days=${dateRange}`),
        fetch(`/api/analytics?type=monthly-profit&days=${dateRange}`)
      ])

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setDailySales(salesData)
      }

      if (profitRes.ok) {
        const profitData = await profitRes.json()
        setDailyProfit(profitData)
      }

      if (sellersRes.ok) {
        const sellersData = await sellersRes.json()
        setBestSellers(sellersData)
      }

      if (monthlyRes.ok) {
        const monthlyData = await monthlyRes.json()
        console.log('Monthly net profit data:', monthlyData)
        setMonthlyNetProfit(monthlyData)
      } else {
        console.error('Failed to fetch monthly profit data:', monthlyRes.status)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const fetchSummary = async () => {
    setSummaryLoading(true)
    try {
      const response = await fetch(`/api/analytics/summary?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchAnalytics()
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchAnalytics()
    fetchSummary()
  }, [dateRange])

  const filteredSales = sales.filter(sale =>
    sale.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  const totalTransactions = sales.length
  const totalProfit = dailyProfit.reduce((sum, day) => sum + day.totalProfit, 0)
  const totalRevenue = dailyProfit.reduce((sum, day) => sum + day.totalRevenue, 0)

  if (loading) {
    return (
      <MainLayout title="Sales Reports" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading sales data...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Analytics & Reports" userRole="tenant-admin">
      <FeatureGuard feature="reports">
      <div className="space-y-8">
        {/* Date Range Selector */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Today's Performance */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Today's Performance</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{dailySales.find(d => d._id === new Date().toISOString().split('T')[0])?.totalSales.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{dailyProfit.find(d => d.date === new Date().toISOString().split('T')[0])?.totalProfit.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dailySales.find(d => d._id === new Date().toISOString().split('T')[0])?.totalTransactions || '0'}
                </div>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yesterday's Sales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    return dailySales.find(d => d._id === yesterday.toISOString().split('T')[0])?.totalSales.toLocaleString() || '0'
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Previous day comparison</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Monthly Net Profit</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {analyticsLoading ? (
              [...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : monthlyNetProfit.length > 0 ? (
              monthlyNetProfit.slice(0, 2).map((month) => (
                <Card key={month.month}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{month.monthName}</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      month.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{month.netProfit.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Revenue: ₹{month.revenue.toLocaleString()} | Cost: ₹{(month.cost || 0).toLocaleString()} | Gross: ₹{month.grossProfit.toLocaleString()} | Expenses: ₹{month.expenses.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Margin: {month.profitMargin.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">No monthly profit data available</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Advanced Analytics - With Trends & Comparisons */}
        {summaryData && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Advanced Analytics (With Growth Trends)</h2>
            <AnalyticsDashboard data={summaryData} loading={summaryLoading} />
          </div>
        )}

        {/* Analytics Tabs */}


        <Tabs defaultValue="monthly-profit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monthly-profit">Monthly Net Profit</TabsTrigger>
            <TabsTrigger value="daily-sales">Daily Sales</TabsTrigger>
            <TabsTrigger value="daily-profit">Daily Profit</TabsTrigger>
            <TabsTrigger value="best-sellers">Best Sellers</TabsTrigger>
            <TabsTrigger value="sales-history">Sales History</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly-profit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>All Monthly Net Profit Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading monthly profit data...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Product Cost</TableHead>
                        <TableHead>Gross Profit</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Net Profit</TableHead>
                        <TableHead>Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyNetProfit.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.monthName}</TableCell>
                          <TableCell className="text-blue-600">₹{month.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-orange-600">₹{(month.cost || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">₹{month.grossProfit.toLocaleString()}</TableCell>
                          <TableCell className="text-red-600">₹{month.expenses.toLocaleString()}</TableCell>
                          <TableCell className={`font-medium ${
                            month.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ₹{month.netProfit.toLocaleString()}
                          </TableCell>
                          <TableCell className={month.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {month.profitMargin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily-sales">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Daily Sales Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading analytics...</div>
                ) : (
                  <div className="space-y-6">
                    {dailySales.length > 0 ? (
                      <SimpleChart 
                        data={dailySales.slice(-7).map(day => ({
                          label: new Date(day._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                          value: day.totalSales || 0
                        }))}
                        height={200}
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/20">
                        <div className="text-muted-foreground">No sales data available for chart</div>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Total Sales</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>Average Sale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailySales.map((day) => (
                          <TableRow key={day._id}>
                            <TableCell>{new Date(day._id).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>₹{day.totalSales.toLocaleString()}</TableCell>
                            <TableCell>{day.totalTransactions}</TableCell>
                            <TableCell>₹{day.averageSale.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily-profit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Daily Profit Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading analytics...</div>
                ) : (
                  <div className="space-y-6">
                    {dailyProfit.length > 0 ? (
                      <SimpleChart 
                        data={dailyProfit.slice(-7).map(day => ({
                          label: new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                          value: day.totalProfit || 0,
                          color: (day.totalProfit || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }))}
                        height={200}
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/20">
                        <div className="text-muted-foreground">No profit data available for chart</div>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Margin %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyProfit.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>{new Date(day.date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>₹{day.totalRevenue.toLocaleString()}</TableCell>
                            <TableCell>₹{day.totalCost.toLocaleString()}</TableCell>
                            <TableCell className="text-green-600">₹{day.totalProfit.toLocaleString()}</TableCell>
                            <TableCell>
                              {day.totalRevenue > 0 ? ((day.totalProfit / day.totalRevenue) * 100).toFixed(1) : '0'}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="best-sellers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Best Selling Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading analytics...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bestSellers.map((product, index) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                #{index + 1} Best Seller
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.totalQuantity}</TableCell>
                          <TableCell>₹{product.totalRevenue.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">₹{product.profit.toLocaleString()}</TableCell>
                          <TableCell>{product.totalTransactions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-history">

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Receipt className="w-5 h-5" />
                    <span>Sales History</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search bills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.billNo}</TableCell>
                        <TableCell>
                          <div>
                            <div>{sale.customerName}</div>
                            {sale.customerPhone && (
                              <div className="text-sm text-muted-foreground">{sale.customerPhone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{sale.items.length} items</TableCell>
                        <TableCell>₹{(sale.total || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}