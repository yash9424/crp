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
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  Filter,
  Download,
  Upload,
  Barcode,
} from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  price: number
  costPrice: number
  stock: number
  minStock: number
  sizes: string[]
  colors: string[]
  description: string
  status: string
  tenantId: string
  storeId: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [importing, setImporting] = useState(false)
  const [dropdownData, setDropdownData] = useState({
    categories: [],
    sizes: [],
    colors: [],
    materials: [],
    brands: []
  })
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
    name: '',
    sku: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '',
    sizes: '',
    colors: '',
    description: '',
    material: '',
    brand: ''
  })
  const { storeName, tenantId } = useStore()

  // Fetch inventory from API
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
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
          brands: data.brands || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    }
  }

  const filterDropdownsByCategory = (category: string) => {
    if (!category || !inventory.length) {
      setFilteredDropdownData({
        sizes: dropdownData.sizes || [],
        colors: dropdownData.colors || [],
        materials: dropdownData.materials || [],
        brands: dropdownData.brands || []
      })
      return
    }

    const categoryItems = inventory.filter((item: any) => item.category === category)
    
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

    setFormData(prev => ({
      ...prev,
      sizes: '',
      colors: ''
    }))
  }

  // Create new inventory item
  const createItem = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sizes: formData.sizes.split(',').map(s => s.trim()),
          colors: formData.colors.split(',').map(c => c.trim())
        })
      })
      if (response.ok) {
        fetchInventory()
        setIsAddDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  // Update inventory item
  const updateItem = async () => {
    if (!selectedItem) return
    try {
      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sizes: formData.sizes.split(',').map(s => s.trim()),
          colors: formData.colors.split(',').map(c => c.trim())
        })
      })
      if (response.ok) {
        fetchInventory()
        setIsEditDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  // Delete inventory item
  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchInventory()
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '',
      sizes: '',
      colors: '',
      description: '',
      material: '',
      brand: ''
    })
    setSelectedItem(null)
  }

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || '',
      price: (item.price ?? 0).toString(),
      costPrice: (item.costPrice ?? 0).toString(),
      stock: (item.stock ?? 0).toString(),
      minStock: (item.minStock ?? 0).toString(),
      sizes: (item.sizes || []).join(', '),
      colors: (item.colors || []).join(', '),
      description: item.description || ''
    })
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    fetchInventory()
    fetchDropdownData()
  }, [tenantId])

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || (item.category || '') === categoryFilter
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && (item.stock || 0) <= (item.minStock || 0)) ||
      (stockFilter === "normal" && (item.stock || 0) > (item.minStock || 0))
    return matchesSearch && matchesCategory && matchesStock
  })

  if (loading) {
    return (
      <MainLayout title="Inventory Management" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading inventory for {storeName || 'your store'}...</div>
        </div>
      </MainLayout>
    )
  }

  const getStockStatus = (item: any) => {
    if (item.stock <= item.minStock) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Low Stock</span>
        </Badge>
      )
    } else if (item.stock >= item.maxStock) {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>Overstock</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center space-x-1">
          <Package className="w-3 h-3" />
          <span>Normal</span>
        </Badge>
      )
    }
  }

  const totalProducts = inventory.length
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock).length
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.costPrice, 0)

  return (
    <MainLayout title="Clothing Inventory Management" userRole="tenant-admin">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{lowStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹   {totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Categories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(inventory.map((item) => item.category)).size}</div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clothing Inventory</CardTitle>
                <CardDescription>Manage your clothing stock, sizes, colors and details</CardDescription>
              </div>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    setImporting(true)
                    const formData = new FormData()
                    formData.append('file', file)
                    
                    try {
                      const response = await fetch('/api/inventory/import', {
                        method: 'POST',
                        body: formData
                      })
                      
                      if (response.ok) {
                        const result = await response.json()
                        alert(`Imported ${result.count} items successfully!`)
                        fetchInventory()
                      } else {
                        alert('Import failed')
                      }
                    } catch (error) {
                      alert('Import error')
                    } finally {
                      setImporting(false)
                      e.target.value = ''
                    }
                  }}
                  style={{ display: 'none' }}
                  id="csv-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  disabled={importing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? 'Importing...' : 'Import CSV'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/api/inventory/export', '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (confirm('Set selling prices for products without them? (Cost Price + 50% markup)')) {
                      try {
                        const response = await fetch('/api/inventory/bulk-update-prices', {
                          method: 'POST'
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          alert(`Updated ${result.count} products with selling prices!`)
                          fetchInventory()
                        } else {
                          alert('Failed to update prices')
                        }
                      } catch (error) {
                        alert('Error updating prices')
                      }
                    }
                  }}
                >
                  Fix Prices
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear ALL inventory items? This cannot be undone!')) {
                      try {
                        const response = await fetch('/api/inventory/clear', {
                          method: 'DELETE'
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          alert(`Cleared ${result.count} items successfully!`)
                          fetchInventory()
                        } else {
                          alert('Failed to clear inventory')
                        }
                      } catch (error) {
                        alert('Error clearing inventory')
                      }
                    }
                  }}
                >
                  Clear All
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Clothing Item</DialogTitle>
                      <DialogDescription>Enter clothing item details for inventory</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="productName">Item Name</Label>
                          <Input 
                            id="productName" 
                            placeholder="Enter item name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sku">SKU</Label>
                          <Input 
                            id="sku" 
                            placeholder="Item SKU" 
                            value={formData.sku}
                            onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="barcode">Barcode</Label>
                          <div className="flex space-x-2">
                            <Input id="barcode" placeholder="Barcode number" className="flex-1" />
                            <Button variant="outline" size="sm">
                              <Barcode className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select value={formData.category} onValueChange={(value) => {
                            setFormData({...formData, category: value})
                            filterDropdownsByCategory(value)
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
                      {/* Added clothing-specific fields */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="size">Size</Label>
                          <Select value={formData.sizes} onValueChange={(value) => setFormData({...formData, sizes: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {(formData.category ? filteredDropdownData.sizes : dropdownData.sizes).map((size) => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="color">Color</Label>
                          <Select value={formData.colors} onValueChange={(value) => setFormData({...formData, colors: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              {(formData.category ? filteredDropdownData.colors : dropdownData.colors).map((color) => (
                                <SelectItem key={color} value={color}>{color}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="material">Material</Label>
                          <Select value={formData.material || ''} onValueChange={(value) => setFormData({...formData, material: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {(formData.category ? filteredDropdownData.materials : dropdownData.materials).map((material) => (
                                <SelectItem key={material} value={material}>{material}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="costPrice">Cost Price</Label>
                          <Input    
                            id="costPrice" 
                            type="number" 
                            placeholder="0.00" 
                            value={formData.costPrice}
                            onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sellingPrice">Selling Price</Label>
                          <Input 
                            id="sellingPrice" 
                            type="number" 
                            placeholder="0.00" 
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initialStock">Initial Stock</Label>
                          <Input 
                            id="initialStock" 
                            type="number" 
                            placeholder="0" 
                            value={formData.stock}
                            onChange={(e) => setFormData({...formData, stock: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minStock">Minimum Stock</Label>
                          <Input 
                            id="minStock" 
                            type="number" 
                            placeholder="0" 
                            value={formData.minStock}
                            onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxStock">Maximum Stock</Label>
                          <Input id="maxStock" type="number" placeholder="0" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Select value={formData.brand || ''} onValueChange={(value) => setFormData({...formData, brand: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {(formData.category ? filteredDropdownData.brands : dropdownData.brands).map((brand) => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Clothing item description" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createItem}>Add Item</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Item</DialogTitle>
                      <DialogDescription>Update item details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editName">Item Name</Label>
                          <Input 
                            id="editName" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editSku">SKU</Label>
                          <Input 
                            id="editSku" 
                            value={formData.sku}
                            onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editCategory">Category</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dropdownData.categories.map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editStock">Stock</Label>
                          <Input 
                            id="editStock" 
                            type="number" 
                            value={formData.stock}
                            onChange={(e) => setFormData({...formData, stock: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editCostPrice">Cost Price</Label>
                          <Input 
                            id="editCostPrice" 
                            type="number" 
                            value={formData.costPrice}
                            onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editPrice">Selling Price</Label>
                          <Input 
                            id="editPrice" 
                            type="number" 
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editMinStock">Min Stock</Label>
                          <Input 
                            id="editMinStock" 
                            type="number" 
                            value={formData.minStock}
                            onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditDialogOpen(false)
                        resetForm()
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={updateItem}>Update Item</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clothing items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {dropdownData.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Overstock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {inventory.length === 0 ? 'Start by adding your first product to inventory' : 'Try adjusting your search or filters'}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Product
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Item</TableHead>
                      <TableHead className="text-center">SKU</TableHead>
                      <TableHead className="text-center">Category</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Cost Price</TableHead>
                      <TableHead className="text-center">Selling Price</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          <div className="font-medium">{item.name || 'No Name'}</div>
                        </TableCell>
                        <TableCell className="text-center">{item.sku || 'No SKU'}</TableCell>
                        <TableCell className="text-center">{item.category || 'No Category'}</TableCell>
                        <TableCell className="text-center">{item.stock || 0}</TableCell>
                        <TableCell className="text-center">
                          {getStockStatus(item)}
                        </TableCell>
                        <TableCell className="text-center">₹ {item.costPrice || 0}</TableCell>
                        <TableCell className="text-center">₹ {item.price || 0}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteItem(item.id)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
