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
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"

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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '', address: '' })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

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
      <FeatureGuard feature="customers">
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
              <div className="text-2xl font-bold">₹ {totalRevenue.toFixed(2)}</div>
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
                <CardDescription>Manage your customer database</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingCustomer(null)
                setCustomerFormData({ name: '', phone: '', email: '', address: '' })
                setIsCustomerDialogOpen(true)
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingCustomer(customer)
                              setCustomerFormData({
                                name: customer.name,
                                phone: customer.phone || '',
                                email: (customer as any).email || '',
                                address: (customer as any).address || ''
                              })
                              setIsCustomerDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setCustomerToDelete(customer)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* View Customer Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>View customer information and purchase history</DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6 py-4">
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {selectedCustomer.name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                    <p className="text-muted-foreground">{selectedCustomer.phone || 'No phone number'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={
                        (selectedCustomer.orderCount || 0) >= 10 ? "default" : 
                        (selectedCustomer.orderCount || 0) >= 5 ? "secondary" : "outline"
                      }>
                        {(selectedCustomer.orderCount || 0) >= 10 ? "VIP Customer" : 
                         (selectedCustomer.orderCount || 0) >= 5 ? "Regular Customer" : "New Customer"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Customer Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Customer ID:</span>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Phone:</span>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Customer Since:</span>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Purchase Summary</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Total Orders:</span>
                        <span className="text-sm text-muted-foreground ml-2">{selectedCustomer.orderCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Total Spent:</span>
                        <span className="text-sm text-muted-foreground ml-2">₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Last Purchase:</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('en-IN') : 'No purchases yet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Average Order Value:</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ₹{selectedCustomer.orderCount > 0 ? Math.round((selectedCustomer.totalSpent || 0) / selectedCustomer.orderCount) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Customer CRUD Dialog */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information' : 'Create a new customer profile'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerFormName">Name *</Label>
                <Input
                  id="customerFormName"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerFormPhone">Phone</Label>
                <Input
                  id="customerFormPhone"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerFormEmail">Email</Label>
                <Input
                  id="customerFormEmail"
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerFormAddress">Address</Label>
                <Input
                  id="customerFormAddress"
                  value={customerFormData.address}
                  onChange={(e) => setCustomerFormData({...customerFormData, address: e.target.value})}
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!customerFormData.name.trim()) {
                      showToast.error('Customer name is required')
                      return
                    }
                    try {
                      const method = editingCustomer ? 'PUT' : 'POST'
                      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
                      const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(customerFormData)
                      })
                      if (response.ok) {
                        showToast.success(`Customer ${editingCustomer ? 'updated' : 'created'} successfully!`)
                        fetchCustomers()
                        setIsCustomerDialogOpen(false)
                      } else {
                        showToast.error(`Failed to ${editingCustomer ? 'update' : 'create'} customer`)
                      }
                    } catch (error) {
                      console.error('Error saving customer:', error)
                    }
                  }}
                >
                  {editingCustomer ? 'Update' : 'Create'}
                </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (customerToDelete) {
                    try {
                      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
                        method: 'DELETE'
                      })
                      if (response.ok) {
                        showToast.success('Customer deleted successfully!')
                        fetchCustomers()
                      } else {
                        showToast.error('Failed to delete customer')
                      }
                    } catch (error) {
                      showToast.error('Error deleting customer')
                    }
                    setIsDeleteDialogOpen(false)
                    setCustomerToDelete(null)
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      </FeatureGuard>
    </MainLayout>
  )
}