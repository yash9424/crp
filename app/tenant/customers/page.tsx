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
import { useLanguage } from "@/lib/language-context"
import { translateName, getAvailableNames } from "@/lib/name-translator"

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
  const { t, language } = useLanguage()
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
      <MainLayout title={t('customers')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
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
    <MainLayout title={t('customers')}>
      <FeatureGuard feature="customers">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalCustomers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('activeCustomers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
              <span className="h-4 w-4 text-muted-foreground text-xl">₹ </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('avgOrderValue')}</CardTitle>
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
                <CardTitle>{t('customerDatabase')}</CardTitle>
                <CardDescription>{t('manageCustomerDatabase')}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => {
                  setEditingCustomer(null)
                  setCustomerFormData({ name: '', phone: '', email: '', address: '' })
                  setIsCustomerDialogOpen(true)
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('addCustomer')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchCustomers')}
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
                    <TableHead className="text-center">{t('customer')}</TableHead>
                    <TableHead className="text-center">{t('contact')}</TableHead>
                    <TableHead className="text-center">{t('orders')}</TableHead>
                    <TableHead className="text-center">{t('totalSpent')}</TableHead>
                    <TableHead className="text-center">{t('status')}</TableHead>
                    <TableHead className="text-center">{t('lastPurchase')}</TableHead>
                    <TableHead className="text-center">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="text-center">
                        <div className="font-medium">{customer.name}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">{customer.phone || t('noPhone')}</div>
                      </TableCell>
                      <TableCell className="text-center">{customer.orderCount || 0}</TableCell>
                      <TableCell className="text-center">₹  {(customer.totalSpent || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          (customer.orderCount || 0) >= 10 ? "default" : 
                          (customer.orderCount || 0) >= 5 ? "secondary" : "outline"
                        }>
                          {(customer.orderCount || 0) >= 10 ? t('vip') : 
                           (customer.orderCount || 0) >= 5 ? t('regular') : t('new')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('en-IN') : t('noOrders')}
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
              <DialogTitle>{t('customerDetails')}</DialogTitle>
              <DialogDescription>{t('viewCustomerInfo')}</DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6 py-4">
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {selectedCustomer.name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                    <p className="text-muted-foreground">{selectedCustomer.phone || t('noPhoneNumber')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={
                        (selectedCustomer.orderCount || 0) >= 10 ? "default" : 
                        (selectedCustomer.orderCount || 0) >= 5 ? "secondary" : "outline"
                      }>
                        {(selectedCustomer.orderCount || 0) >= 10 ? t('vipCustomer') : 
                         (selectedCustomer.orderCount || 0) >= 5 ? t('regularCustomer') : t('newCustomer')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('customerInformation')}</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">{t('customerId')}:</span>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{t('phone')}:</span>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone || t('notProvided')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{t('customerSince')}:</span>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('purchaseSummary')}</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">{t('totalOrders')}:</span>
                        <span className="text-sm text-muted-foreground ml-2">{selectedCustomer.orderCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{t('totalSpent')}:</span>
                        <span className="text-sm text-muted-foreground ml-2">₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{t('lastPurchase')}:</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('en-IN') : t('noPurchasesYet')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{t('avgOrderValue')}:</span>
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
              <DialogTitle>{editingCustomer ? t('editCustomer') : t('addNewCustomer')}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? t('updateCustomerInfo') : t('createNewCustomerProfile')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerFormName">{t('name')} *</Label>
                <Input
                  id="customerFormName"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})}
                  placeholder={t('enterCustomerName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerFormPhone">{t('phone')}</Label>
                <Input
                  id="customerFormPhone"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                  placeholder={t('enterPhoneNumber')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerFormEmail">{t('email')}</Label>
                <Input
                  id="customerFormEmail"
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                  placeholder={t('enterEmailAddress')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerFormAddress">{t('address')}</Label>
                <Input
                  id="customerFormAddress"
                  value={customerFormData.address}
                  onChange={(e) => setCustomerFormData({...customerFormData, address: e.target.value})}
                  placeholder={t('enterAddress')}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  onClick={async () => {
                    if (!customerFormData.name.trim()) {
                      showToast.error(t('customerNameRequired'))
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
                        showToast.success(editingCustomer ? t('customerUpdatedSuccess') : t('customerCreatedSuccess'))
                        fetchCustomers()
                        setIsCustomerDialogOpen(false)
                      } else {
                        showToast.error(editingCustomer ? t('failedToUpdateCustomer') : t('failedToCreateCustomer'))
                      }
                    } catch (error) {
                      console.error('Error saving customer:', error)
                    }
                  }}
                >
                  {editingCustomer ? t('update') : t('create')}
                </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('deleteCustomer')}</DialogTitle>
              <DialogDescription>
                {t('confirmDeleteCustomer')} {customerToDelete?.name}? {t('actionCannotBeUndone')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t('cancel')}
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
                        showToast.success(t('customerDeletedSuccess'))
                        fetchCustomers()
                      } else {
                        showToast.error(t('failedToDeleteCustomer'))
                      }
                    } catch (error) {
                      showToast.error(t('errorDeletingCustomer'))
                    }
                    setIsDeleteDialogOpen(false)
                    setCustomerToDelete(null)
                  }
                }}
              >
                {t('delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      </FeatureGuard>
    </MainLayout>
  )
}