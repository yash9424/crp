"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Package, Truck, DollarSign, Clock, Check } from "lucide-react"

interface Purchase {
  id: string
  poNumber: string
  supplierName: string
  supplierContact: string
  items: any[]
  subtotal: number
  tax: number
  total: number
  status: string
  orderDate: string
  expectedDelivery: string
  createdAt: string
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [dropdownData, setDropdownData] = useState({
    categories: [],
    sizes: [],
    colors: [],
    materials: [],
    brands: [],
    suppliers: []
  })
  const [inventoryData, setInventoryData] = useState([])
  const [filteredDropdownData, setFilteredDropdownData] = useState<{
    sizes: string[]
    colors: string[]
    materials: string[]
    brands: string[]
  }>({
    sizes: [],
    colors: [],
    materials: [],
    brands: []
  })
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierContact: '',
    supplierContactNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    items: [{ name: '', category: '', quantity: 0, updateInventory: true, sku: '', sizes: '', colors: '', brand: '', material: '' }],
    notes: ''
  })

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/purchases')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data)
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const response = await fetch('/api/dropdown-data')
      if (response.ok) {
        const data = await response.json()
        setDropdownData({
          categories: data.categories || [],
          sizes: data.sizes || [],
          colors: data.colors || [],
          materials: data.materials || [],
          brands: data.brands || [],
          suppliers: data.suppliers || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    }
  }

  const fetchInventoryData = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory data:', error)
    }
  }

  const filterDropdownsByCategory = (category: string, itemIndex: number) => {
    if (!category || !inventoryData.length) {
      setFilteredDropdownData({
        sizes: dropdownData.sizes || [],
        colors: dropdownData.colors || [],
        materials: dropdownData.materials || [],
        brands: dropdownData.brands || []
      })
      return
    }

    const categoryItems = inventoryData.filter((item: any) => item.category === category)
    
    const availableSizes = [...new Set(categoryItems.flatMap((item: any) => item.sizes || []))].filter(Boolean)
    const availableColors = [...new Set(categoryItems.flatMap((item: any) => item.colors || []))].filter(Boolean)
    const availableMaterials = [...new Set(categoryItems.map((item: any) => item.material).filter(Boolean))]
    const availableBrands = [...new Set(categoryItems.map((item: any) => item.brand).filter(Boolean))]

    setFilteredDropdownData({
      sizes: availableSizes,
      colors: availableColors,
      materials: availableMaterials,
      brands: availableBrands
    })

    updateItem(itemIndex, 'sizes', '')
    updateItem(itemIndex, 'colors', '')
    updateItem(itemIndex, 'material', '')
    updateItem(itemIndex, 'brand', '')
  }

  const createPurchase = async () => {
    try {
      const purchaseData = {
        ...formData,
        poNumber: `PO-${Date.now()}`,
        status: 'pending'
      }
      
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData)
      })
      
      if (response.ok) {
        fetchPurchases()
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create purchase:', error)
    }
  }

  const completePurchaseOrder = async (purchaseId: string) => {
    if (!confirm('Complete this purchase order? Items will be added to inventory.')) return
    
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      
      if (response.ok) {
        fetchPurchases()
        alert('Purchase order completed! Items have been added to inventory.')
      } else {
        alert('Failed to complete purchase order')
      }
    } catch (error) {
      console.error('Failed to complete purchase order:', error)
      alert('Error completing purchase order')
    }
  }

  const resetForm = () => {
    setFormData({
      supplierName: '',
      supplierContact: '',
      supplierContactNo: '',
      orderDate: new Date().toISOString().split('T')[0],
      items: [{ name: '', category: '', quantity: 0, updateInventory: true, sku: '', sizes: '', colors: '', brand: '', material: '' }],
      notes: ''
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', category: '', quantity: 0, updateInventory: true, sku: '', sizes: '', colors: '', brand: '', material: '' }]
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  useEffect(() => {
    fetchPurchases()
    fetchDropdownData()
    fetchInventoryData()
  }, [])

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purchase.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPurchases = purchases.length
  const pendingOrders = purchases.filter(p => p.status === 'pending').length
  const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0)
  const activeSuppliers = new Set(purchases.map(p => p.supplierName)).size

  if (loading) {
    return (
      <MainLayout title="Purchase Management" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading purchases...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Purchase Management" userRole="tenant-admin">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPurchases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSuppliers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Manage inventory purchases and supplier orders</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Purchase Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Purchase Order</DialogTitle>
                    <DialogDescription>Add new inventory purchase order</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* Supplier Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Supplier Name</Label>
                        <Select value={formData.supplierName} onValueChange={(value) => setFormData(prev => ({...prev, supplierName: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {dropdownData.suppliers.map((supplier) => (
                              <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input 
                          value={formData.supplierContact}
                          onChange={(e) => setFormData(prev => ({...prev, supplierContact: e.target.value}))}
                          placeholder="Contact person name" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input 
                          value={formData.supplierContactNo}
                          onChange={(e) => setFormData(prev => ({...prev, supplierContactNo: e.target.value}))}
                          placeholder="Supplier contact number" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Order Date</Label>
                        <Input 
                          type="date" 
                          value={formData.orderDate}
                          onChange={(e) => setFormData(prev => ({...prev, orderDate: e.target.value}))}
                        />
                      </div>
                    </div> 

                    {/* Items Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Order Items</Label>
                        <Button variant="outline" size="sm" onClick={addItem}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                      
                      {formData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label>Item Name</Label>
                              <Input 
                                value={item.name}
                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                placeholder="Item name" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>SKU</Label>
                              <Input 
                                value={item.sku}
                                onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                placeholder="SKU code" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Select value={item.category} onValueChange={(value) => {
                                updateItem(index, 'category', value)
                                filterDropdownsByCategory(value, index)
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropdownData.categories.map((category) => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label>Sizes</Label>
                              <Select value={item.sizes} onValueChange={(value) => updateItem(index, 'sizes', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sizes" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(item.category ? filteredDropdownData.sizes : dropdownData.sizes).map((size) => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Colors</Label>
                              <Select value={item.colors} onValueChange={(value) => updateItem(index, 'colors', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select colors" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(item.category ? filteredDropdownData.colors : dropdownData.colors).map((color) => (
                                    <SelectItem key={color} value={color}>{color}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Brand</Label>
                              <Select value={item.brand} onValueChange={(value) => updateItem(index, 'brand', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(item.category ? filteredDropdownData.brands : dropdownData.brands).map((brand) => (
                                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Material</Label>
                              <Select value={item.material} onValueChange={(value) => updateItem(index, 'material', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select material" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(item.category ? filteredDropdownData.materials : dropdownData.materials).map((material) => (
                                    <SelectItem key={material} value={material}>{material}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input 
                                type="number" 
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                placeholder="0" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                        placeholder="Additional notes" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={createPurchase}>Create Purchase Order</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search purchase orders..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Order ID</TableHead>
                    <TableHead className="text-center">Supplier</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-center">Order Date</TableHead>
                    <TableHead className="text-center">Total Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium text-center">{purchase.poNumber}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{purchase.supplierName}</div>
                          <div className="text-sm text-muted-foreground">{purchase.supplierContact}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{purchase.items?.length || 0} items</TableCell>
                      <TableCell className="text-center">{new Date(purchase.orderDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="text-center">₹ {(purchase.total || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          purchase.status === 'pending' ? 'secondary' :
                          purchase.status === 'completed' ? 'default' :
                          purchase.status === 'delivered' ? 'default' : 'outline'
                        }>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {purchase.status === 'pending' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => completePurchaseOrder(purchase.id)}
                              title="Complete Order"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
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
      </div>
    </MainLayout>
  )
}