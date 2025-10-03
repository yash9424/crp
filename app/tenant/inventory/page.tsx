"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store-context"
import { MainLayout } from "@/components/layout/main-layout"
import { FeatureGuard } from "@/components/feature-guard"
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
  Crown,
} from "lucide-react"
import { showToast, confirmDelete } from "@/lib/toast"
import { UpgradePopup } from "@/components/upgrade-popup"

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
  const [settings, setSettings] = useState({ taxRate: 10 })
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
    finalPrice: '',
    costPrice: '',
    stock: '',
    minStock: '',
    sizes: '',
    colors: '',
    description: '',
    material: '',
    brand: ''
  })
  const [planLimits, setPlanLimits] = useState<{
    maxProducts: number
    maxUsers: number
    currentProducts: number
    currentUsers: number
    planName: string
  } | null>(null)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ taxRate: data.taxRate || 10 })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchPlanLimits = async () => {
    try {
      const response = await fetch('/api/plan-limits')
      if (response.ok) {
        const data = await response.json()
        setPlanLimits(data)
      }
    } catch (error) {
      console.error('Failed to fetch plan limits:', error)
    }
  }

  const calculatePriceExcludingGST = (originalPrice: number) => {
    const taxRate = settings.taxRate || 10
    const taxAmount = (originalPrice * taxRate) / 100
    return (originalPrice - taxAmount).toFixed(2)
  }

  const filterDropdownsByCategory = (category: string) => {
    // Always show all dropdown options
    setFilteredDropdownData({
      sizes: dropdownData.sizes || [],
      colors: dropdownData.colors || [],
      materials: dropdownData.materials || [],
      brands: dropdownData.brands || []
    })

    setFormData(prev => ({
      ...prev,
      sizes: '',
      colors: '',
      material: '',
      brand: ''
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
          price: formData.finalPrice,
          originalPrice: formData.price,
          sizes: formData.sizes.split(',').map(s => s.trim()),
          colors: formData.colors.split(',').map(c => c.trim())
        })
      })
      
      if (response.ok) {
        fetchInventory()
        fetchPlanLimits() // Refresh limits
        setIsAddDialogOpen(false)
        resetForm()
        showToast.success('✅ Product added to inventory successfully!')
      } else if (response.status === 403) {
        const errorData = await response.json()
        if (errorData.error === 'PRODUCT_LIMIT_EXCEEDED') {
          setPlanLimits(errorData.limits)
          setShowUpgradePopup(true)
          setIsAddDialogOpen(false)
        } else {
          showToast.error('❌ ' + (errorData.message || 'Failed to add product'))
        }
      } else {
        showToast.error('❌ Failed to add product. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create item:', error)
      showToast.error('❌ Error adding product. Please check your connection.')
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
          price: formData.finalPrice,
          originalPrice: formData.price,
          sizes: formData.sizes.split(',').map(s => s.trim()),
          colors: formData.colors.split(',').map(c => c.trim())
        })
      })
      if (response.ok) {
        fetchInventory()
        setIsEditDialogOpen(false)
        resetForm()
        showToast.success('✅ Product updated successfully!')
      } else {
        showToast.error('❌ Failed to update product. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update item:', error)
      showToast.error('❌ Error updating product. Please check your connection.')
    }
  }

  // Delete inventory item
  const deleteItem = async (id: string) => {
    if (!confirmDelete('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) return
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchInventory()
        showToast.success('🗑️ Product deleted successfully!')
      } else {
        showToast.error('❌ Failed to delete product. Please try again.')
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      showToast.error('❌ Error deleting product. Please check your connection.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      price: '',
      finalPrice: '',
      costPrice: '',
      stock: '',
      minStock: '',
      sizes: '',
      colors: '',
      description: '',
      material: '',
      brand: ''
    })
    setFilteredDropdownData({
      sizes: dropdownData.sizes || [],
      colors: dropdownData.colors || [],
      materials: dropdownData.materials || [],
      brands: dropdownData.brands || []
    })
    setSelectedItem(null)
  }

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    const currentPrice = (item.price ?? 0).toString()
    setFormData({
      name: item.name || '',
        sku: item.sku || '',
      category: item.category || '',
      price: currentPrice,
      finalPrice: currentPrice,
      costPrice: (item.costPrice ?? 0).toString(),
      stock: (item.stock ?? 0).toString(),
      minStock: (item.minStock ?? 0).toString(),
      sizes: (item.sizes || []).join(', '),
      colors: (item.colors || []).join(', '),
      description: item.description || '',
      material: (item as any).material || '',
      brand: (item as any).brand || ''
    })
    setFilteredDropdownData({
      sizes: dropdownData.sizes || [],
      colors: dropdownData.colors || [],
      materials: dropdownData.materials || [],
      brands: dropdownData.brands || []
    })
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    fetchInventory()
    fetchDropdownData()
    fetchSettings()
    fetchPlanLimits()
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
    const stock = item.stock || 0
    const minStock = item.minStock || 0
    
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Out of Stock</span>
        </Badge>
      )
    } else if (stock <= minStock) {
      return (
        <Badge variant="outline" className="flex items-center space-x-1 text-orange-600 border-orange-600">
          <AlertTriangle className="w-3 h-3" />
          <span>Low Stock</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center space-x-1">
          <Package className="w-3 h-3" />
          <span>In Stock</span>
        </Badge>
      )
    }
  }

  const totalProducts = inventory.length
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock).length
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.costPrice, 0)

  return (
    <MainLayout title="Clothing Inventory Management" userRole="tenant-admin">
      <FeatureGuard feature="inventory">
        <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className={planLimits && totalProducts >= planLimits.maxProducts * 0.9 ? 'border-orange-200 bg-orange-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Products</CardTitle>
              <div className="flex items-center gap-2">
                {planLimits && totalProducts >= planLimits.maxProducts && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              {planLimits && (
                <div className="space-y-2 mt-2">
                  <div className="text-xs text-muted-foreground">
                    {totalProducts}/{planLimits.maxProducts} ({planLimits.planName})
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        totalProducts >= planLimits.maxProducts 
                          ? 'bg-red-500' 
                          : totalProducts >= planLimits.maxProducts * 0.9 
                          ? 'bg-orange-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((totalProducts / planLimits.maxProducts) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {totalProducts >= planLimits.maxProducts && (
                    <div className="text-xs text-red-600 font-medium">
                      Limit reached! Upgrade to add more products.
                    </div>
                  )}
                  {totalProducts >= planLimits.maxProducts * 0.9 && totalProducts < planLimits.maxProducts && (
                    <div className="text-xs text-orange-600 font-medium">
                      Approaching limit. Consider upgrading soon.
                    </div>
                  )}
                </div>
              )}
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
                {planLimits && totalProducts >= planLimits.maxProducts && (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      Product limit reached ({totalProducts}/{planLimits.maxProducts})
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {planLimits && totalProducts >= planLimits.maxProducts && (
                  <Button 
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => setShowUpgradePopup(true)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                )}
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
                        alert(`✅ Successfully imported ${result.count} products!`)
                        fetchInventory()
                        fetchPlanLimits() // Refresh limits
                      } else if (response.status === 403) {
                        const errorData = await response.json()
                        if (errorData.error === 'PRODUCT_LIMIT_EXCEEDED') {
                          setPlanLimits(errorData.limits)
                          setShowUpgradePopup(true)
                        } else {
                          alert('❌ ' + (errorData.message || 'Import failed'))
                        }
                      } else {
                        alert('❌ Import failed. Please check your CSV file format.')
                      }
                    } catch (error) {
                      alert('❌ Import error. Please try again.')
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
                    if (confirm('💰 Set selling prices for products without them? (Cost Price + 50% markup)')) {
                      try {
                        const response = await fetch('/api/inventory/bulk-update-prices', {
                          method: 'POST'
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          alert(`💰 Updated ${result.count} products with selling prices!`)
                          fetchInventory()
                        } else {
                          alert('❌ Failed to update prices. Please try again.')
                        }
                      } catch (error) {
                        alert('❌ Error updating prices. Please check your connection.')
                      }
                    }
                  }}
                >
                  Fix Prices
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('⚠️ Are you sure you want to clear ALL inventory items? This action cannot be undone!')) {
                      try {
                        const response = await fetch('/api/inventory/clear', {
                          method: 'DELETE'
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          alert(`🗑️ Successfully cleared ${result.count} products from inventory!`)
                          fetchInventory()
                        } else {
                          alert('❌ Failed to clear inventory. Please try again.')
                        }
                      } catch (error) {
                        alert('❌ Error clearing inventory. Please check your connection.')
                      }
                    }
                  }}
                >
                  Clear All
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  if (open) {
                    // Check if at product limit before opening dialog
                    if (planLimits && totalProducts >= planLimits.maxProducts) {
                      setShowUpgradePopup(true)
                      return
                    }
                    resetForm()
                  }
                  setIsAddDialogOpen(open)
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b">
                      <DialogTitle className="text-xl font-semibold">Add New Clothing Item</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">Enter clothing item details for inventory</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1 py-4">
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="productName" className="text-sm font-medium">Item Name *</Label>
                              <Input 
                                id="productName" 
                                placeholder="Enter item name" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                              <Input 
                                id="sku" 
                                placeholder="Item SKU" 
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="barcode" className="text-sm font-medium">Barcode</Label>
                              <div className="flex space-x-2">
                                <Input id="barcode" placeholder="Barcode number" className="flex-1 h-10" />
                                <Button variant="outline" size="sm" className="h-10 px-3">
                                  <Barcode className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                              <Select value={formData.category} onValueChange={(value) => {
                                setFormData({...formData, category: value})
                                filterDropdownsByCategory(value)
                              }}>
                                <SelectTrigger className="h-10">
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
                        </div>
                        {/* Clothing Attributes */}
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">Clothing Attributes</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="size" className="text-sm font-medium">Size</Label>
                              <Select value={formData.sizes} onValueChange={(value) => setFormData({...formData, sizes: value})}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropdownData.sizes.map((size) => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="material" className="text-sm font-medium">Material</Label>
                              <Select value={formData.material || ''} onValueChange={(value) => setFormData({...formData, material: value})}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select material" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropdownData.materials.map((material) => (
                                    <SelectItem key={material} value={material}>{material}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                              <Select value={formData.brand || ''} onValueChange={(value) => setFormData({...formData, brand: value})}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropdownData.brands.map((brand) => (
                                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        {/* Pricing */}
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">Pricing Information</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="costPrice" className="text-sm font-medium">Cost Price</Label>
                              <Input    
                                id="costPrice" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.costPrice}
                                onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price *</Label>
                              <Input 
                                id="sellingPrice" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.price}
                                onChange={(e) => {
                                  const priceWithGST = parseFloat(e.target.value) || 0
                                  const finalPrice = calculatePriceExcludingGST(priceWithGST)
                                  setFormData({...formData, price: e.target.value, finalPrice: finalPrice})
                                }}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="finalPrice" className="text-sm font-medium">Final Price (After Tax {settings.taxRate}%)</Label>
                              <Input 
                                id="finalPrice" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.finalPrice}
                                readOnly
                                className="bg-gray-100 h-10 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Stock Management */}
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">Stock Management</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="initialStock" className="text-sm font-medium">Initial Stock *</Label>
                              <Input 
                                id="initialStock" 
                                type="number" 
                                placeholder="0" 
                                value={formData.stock}
                                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="minStock" className="text-sm font-medium">Minimum Stock</Label>
                              <Input 
                                id="minStock" 
                                type="number" 
                                placeholder="0" 
                                value={formData.minStock}
                                onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="maxStock" className="text-sm font-medium">Maximum Stock</Label>
                              <Input id="maxStock" type="number" placeholder="0" className="h-10" />
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">Additional Details</h3>
                          <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                            <Textarea 
                              id="description" 
                              placeholder="Clothing item description, features, care instructions..." 
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              className="min-h-[80px] resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="px-6">
                        Cancel
                      </Button>
                      <Button onClick={createItem} className="px-6 bg-blue-600 hover:bg-blue-700">
                        Add Item
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                  setIsEditDialogOpen(open)
                  if (!open) {
                    resetForm()
                  }
                }}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editSize">Size</Label>
                          <Select value={formData.sizes} onValueChange={(value) => setFormData({...formData, sizes: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {dropdownData.sizes.map((size) => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editMaterial">Material</Label>
                          <Select value={formData.material} onValueChange={(value) => setFormData({...formData, material: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {dropdownData.materials.map((material) => (
                                <SelectItem key={material} value={material}>{material}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            onChange={(e) => {
                              const priceWithGST = parseFloat(e.target.value) || 0
                              const finalPrice = calculatePriceExcludingGST(priceWithGST)
                              setFormData({...formData, price: e.target.value, finalPrice: finalPrice})
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editFinalPrice">Final Price (After Tax {settings.taxRate}% deduction)</Label>
                          <Input 
                            id="editFinalPrice" 
                            type="number" 
                            value={formData.finalPrice}
                            readOnly
                            className="bg-gray-50"
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editBrand">Brand</Label>
                          <Select value={formData.brand} onValueChange={(value) => setFormData({...formData, brand: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {dropdownData.brands.map((brand) => (
                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editDescription">Description</Label>
                          <Textarea 
                            id="editDescription" 
                            placeholder="Item description" 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                <Button onClick={() => {
                  if (planLimits && totalProducts >= planLimits.maxProducts) {
                    setShowUpgradePopup(true)
                    return
                  }
                  setIsAddDialogOpen(true)
                }}>
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
        
        {/* Upgrade Popup */}
        {planLimits && (
          <UpgradePopup 
            isOpen={showUpgradePopup}
            onClose={() => setShowUpgradePopup(false)}
            limits={planLimits}
            type="product"
          />
        )}
      </FeatureGuard>
    </MainLayout>
  )
}
