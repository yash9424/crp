"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Receipt, Calendar, TrendingDown, BarChart3 } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  description: string
  date: string
  createdBy: string
  createdAt: string
}

const expenseCategories = [
  'Rent', 'Utilities', 'Inventory', 'Marketing', 'Staff Salary', 
  'Transportation', 'Office Supplies', 'Maintenance', 'Insurance', 'Other'
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setDialogOpen(false)
        setFormData({
          title: '',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        fetchExpenses()
      }
    } catch (error) {
      console.error('Failed to create expense:', error)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const now = new Date()
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  }).reduce((sum, expense) => sum + expense.amount, 0)

  // Monthly expense analysis
  const monthlyExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthName, total: 0, count: 0, expenses: [] }
    }
    
    acc[monthKey].total += expense.amount
    acc[monthKey].count += 1
    acc[monthKey].expenses.push(expense)
    
    return acc
  }, {} as Record<string, { month: string; total: number; count: number; expenses: Expense[] }>)

  const monthlyData = Object.values(monthlyExpenses).sort((a, b) => b.month.localeCompare(a.month))

  // Category-wise expenses
  const categoryExpenses = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categoryExpenses)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  if (loading) {
    return (
      <MainLayout title="Expenses" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading expenses...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Expense Management" userRole="tenant-admin">
      <FeatureGuard feature="expenses">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Expense Management</h1>
              <p className="text-muted-foreground">Track and manage business expenses</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="title">Expense Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Office Rent"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Optional details about this expense"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">Add Expense</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{thisMonthExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average/Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{monthlyData.length > 0 ? Math.round(totalExpenses / monthlyData.length).toLocaleString() : '0'}</div>
                <p className="text-xs text-muted-foreground">Monthly average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expenses.length}</div>
                <p className="text-xs text-muted-foreground">Expense entries</p>
              </CardContent>
            </Card>
          </div>

          {/* Expense Analysis Tabs */}
          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList>
              <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="all">All Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Month-wise Expense Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyData.map((month) => (
                      <div key={month.month} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="font-semibold">{month.month}</h3>
                            <p className="text-sm text-muted-foreground">{month.count} expenses</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">₹{month.total.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Avg: ₹{Math.round(month.total / month.count).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          {month.expenses.slice(0, 3).map((expense) => (
                            <div key={expense.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                                <span>{expense.title}</span>
                              </div>
                              <span className="font-medium">₹{expense.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          {month.expenses.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{month.expenses.length - 3} more expenses</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Category-wise Expenses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCategories.map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {expenses.filter(e => e.category === category).length} expenses
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">₹{amount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {((amount / totalExpenses) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Receipt className="w-5 h-5" />
                    <span>All Expense Records</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">₹{expense.amount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(expense.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description || '-'}</TableCell>
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