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
import { useLanguage } from "@/lib/language-context"

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
  const { t } = useLanguage()
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
        setSales(Array.isArray(data) ? data : [])
      } else {
        setSales([])
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error)
      setSales([])
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

  const filteredSales = Array.isArray(sales) ? sales.filter(sale =>
    sale.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  const totalSales = Array.isArray(sales) ? sales.reduce((sum, sale) => sum + (sale.total || 0), 0) : 0
  const totalTransactions = Array.isArray(sales) ? sales.length : 0
  const totalProfit = dailyProfit.reduce((sum, day) => sum + day.totalProfit, 0)
  const totalRevenue = dailyProfit.reduce((sum, day) => sum + day.totalRevenue, 0)

  if (loading) {
    return (
      <MainLayout title={t('salesReports')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loadingSalesData')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('analyticsReports')}>
      <FeatureGuard feature="reports">
      <div className="space-y-8">
        {/* Date Range Selector */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('analyticsReports')}</h1>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('last7Days')}</SelectItem>
              <SelectItem value="30">{t('last30Days')}</SelectItem>
              <SelectItem value="90">{t('last90Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Today's Performance */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('todaysPerformance')}</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('todaysSales')}</CardTitle>
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
                <CardTitle className="text-sm font-medium">{t('todaysProfit')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (dailyProfit.find(d => d.date === new Date().toISOString().split('T')[0])?.totalProfit || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ₹{dailyProfit.find(d => d.date === new Date().toISOString().split('T')[0])?.totalProfit.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('todaysOrders')}</CardTitle>
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
                <CardTitle className="text-sm font-medium">{t('yesterdaysSales')}</CardTitle>
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
                <p className="text-xs text-muted-foreground">{t('previousDayComparison')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('monthlyNetProfit')}</h2>
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
                      {t('revenue')}: ₹{month.revenue.toLocaleString()} | {t('cost')}: ₹{(month.cost || 0).toLocaleString()} | {t('grossProfit')}: ₹{month.grossProfit.toLocaleString()} | {t('expenses')}: ₹{month.expenses.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('marginPercent')}: {month.profitMargin.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">{t('noMonthlyProfitData')}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Advanced Analytics - With Trends & Comparisons */}
        {summaryData && (
          <div>
            <h2 className="text-lg font-semibold mb-4">{t('advancedAnalytics')}</h2>
            <AnalyticsDashboard data={summaryData} loading={summaryLoading} />
          </div>
        )}

        {/* Analytics Tabs */}


        <Tabs defaultValue="monthly-profit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monthly-profit">{t('monthlyNetProfit')}</TabsTrigger>
            <TabsTrigger value="daily-sales">{t('dailySalesReport')}</TabsTrigger>
            <TabsTrigger value="daily-profit">{t('dailyProfitReport')}</TabsTrigger>
            <TabsTrigger value="best-sellers">{t('bestSellingProducts')}</TabsTrigger>
            <TabsTrigger value="sales-history">{t('salesHistory')}</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly-profit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{t('allMonthlyNetProfitData')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">{t('loadingMonthlyProfitData')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('month')}</TableHead>
                        <TableHead>{t('revenue')}</TableHead>
                        <TableHead>{t('productCost')}</TableHead>
                        <TableHead>{t('grossProfit')}</TableHead>
                        <TableHead>{t('expenses')}</TableHead>
                        <TableHead>{t('netProfit')}</TableHead>
                        <TableHead>{t('marginPercent')}</TableHead>
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
                  <span>{t('dailySalesReport')}</span>
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
                        <div className="text-muted-foreground">{t('noSalesDataForChart')}</div>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('date')}</TableHead>
                          <TableHead>{t('totalSales')}</TableHead>
                          <TableHead>{t('transactions')}</TableHead>
                          <TableHead>{t('averageSale')}</TableHead>
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
                  <span>{t('dailyProfitReport')}</span>
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
                        <div className="text-muted-foreground">{t('noProfitDataForChart')}</div>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('date')}</TableHead>
                          <TableHead>{t('revenue')}</TableHead>
                          <TableHead>{t('cost')}</TableHead>
                          <TableHead>{t('profit')}</TableHead>
                          <TableHead>{t('marginPercent')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyProfit.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>{new Date(day.date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>₹{day.totalRevenue.toLocaleString()}</TableCell>
                            <TableCell>₹{day.totalCost.toLocaleString()}</TableCell>
                            <TableCell className={day.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>₹{day.totalProfit.toLocaleString()}</TableCell>
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
                  <span>{t('bestSellingProducts')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading analytics...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('product')}</TableHead>
                        <TableHead>{t('quantitySold')}</TableHead>
                        <TableHead>{t('revenue')}</TableHead>
                        <TableHead>{t('profit')}</TableHead>
                        <TableHead>{t('transactions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bestSellers.map((product, index) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                #{index + 1} {t('bestSeller')}
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
                    <span>{t('salesHistory')}</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t('searchBills')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      {t('export')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('billNo')}</TableHead>
                      <TableHead>{t('customer')}</TableHead>
                      <TableHead>{t('items')}</TableHead>
                      <TableHead>{t('total')}</TableHead>
                      <TableHead>{t('paymentMethod')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
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
                        <TableCell>{sale.items.length} {t('itemsCount')}</TableCell>
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