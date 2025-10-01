"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store-context"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  Star,
  ShoppingBag,
  DollarSign,
  UserPlus,
  Gift,
} from "lucide-react"

interface Customer {
  id: string
  name: string
  phone?: string
  orderCount: number
  totalSpent: number
  lastOrderDate: string
  createdAt: string
}



export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { storeName, tenantId } = useStore()


  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm)
    return matchesSearch
  })

  if (loading) {
    return (
      <MainLayout title="Customer Management" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading customers for {storeName || 'your store'}...</div>
        </div>
      </MainLayout>
    )
  }

  // Dynamic calculations
  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.orderCount > 0).length
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  return (
    <MainLayout title="Customer Management" userRole="tenant-admin">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <span className="h-4 w-4 text-muted-foreground text-xl">₹ </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {totalRevenue}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {avgOrderValue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Database</CardTitle>
                <CardDescription>Customers are automatically added when making sales in POS</CardDescription>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Customer</TableHead>
                    <TableHead className="text-center">Contact</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-center">Total Spent</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Last Purchase</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="text-center">
                        <div className="font-medium">{customer.name}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">{customer.phone || 'No phone'}</div>
                      </TableCell>
                      <TableCell className="text-center">{customer.orderCount || 0}</TableCell>
                      <TableCell className="text-center">₹  {(customer.totalSpent || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          (customer.orderCount || 0) >= 10 ? "default" : 
                          (customer.orderCount || 0) >= 5 ? "secondary" : "outline"
                        }>
                          {(customer.orderCount || 0) >= 10 ? "VIP" : 
                           (customer.orderCount || 0) >= 5 ? "Regular" : "New"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('en-IN') : 'No orders'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  )
}