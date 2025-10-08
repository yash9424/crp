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
  RefreshCw,
  Printer,
} from "lucide-react"
import { showToast, confirmDelete } from "@/lib/toast"
import { UpgradePopup } from "@/components/upgrade-popup"
import { generateBarcode, validateBarcode } from "@/lib/barcode-utils"
import { BarcodeDisplay, PrintableBarcode } from "@/components/barcode-display"
import { BulkBarcodePrint } from "@/components/bulk-barcode-print"
import { QuantityBarcodePrint } from "@/components/quantity-barcode-print"

interface InventoryItem {
  id: string
  name: string
  sku: string
  barcode?: string
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [importing, setImporting] = useState(false)
  const [settings, setSettings] = useState({ taxRate: 0, discountMode: false })
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
    barcode: '',
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
        setSettings({ taxRate: data.taxRate ?? 0, discountMode: data.discountMode || false })
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
      const requestData = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || `SKU-${Date.now()}`,
        barcode: formData.barcode.trim(),
        category: formData.category,
        price: formData.price || formData.finalPrice,
        finalPrice: formData.finalPrice,
        costPrice: formData.costPrice || '0',
        stock: formData.stock,
        minStock: formData.minStock || '0',
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [],
        colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [],
        brand: formData.brand || '',
        material: formData.material || '',
        description: formData.description || ''
      }

      console.log('Sending product data:', requestData)

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      if (response.ok) {
        fetchInventory()
        fetchPlanLimits() // Refresh limits
        setIsAddDialogOpen(false)
        resetForm()
        showToast.success('✅ Product added to inventory successfully!')
      } else {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        
        if (response.status === 403 && errorData.error === 'PRODUCT_LIMIT_EXCEEDED') {
          setPlanLimits(errorData.limits)
          setShowUpgradePopup(true)
          setIsAddDialogOpen(false)
        } else {
          const errorMessage = errorData.details || errorData.message || errorData.error || 'Failed to add product'
          showToast.error(`❌ ${errorMessage}`)
        }
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

  const openDeleteDialog = (item: InventoryItem) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const deleteItem = async () => {
    if (!itemToDelete) return
    try {
      const response = await fetch(`/api/inventory/${itemToDelete.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchInventory()
        setIsDeleteDialogOpen(false)
        setItemToDelete(null)
        showToast.success('Product deleted successfully!')
      } else {
        showToast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      showToast.error('Error deleting product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
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
      barcode: (item as any).barcode || '',
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

  // Refresh settings when component mounts
  useEffect(() => {
    const refreshSettings = async () => {
      try {
        const response = await fetch('/api/settings?t=' + Date.now())
        if (response.ok) {
          const data = await response.json()
          console.log('Fresh settings:', data)
          setSettings(data)
        }
      } catch (error) {
        console.error('Failed to refresh settings:', error)
      }
    }
    refreshSettings()
  }, [])

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((item as any).barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                        showToast.success(`✅ Successfully imported ${result.count} products!`)
                        fetchInventory()
                        fetchPlanLimits() // Refresh limits
                      } else if (response.status === 403) {
                        const errorData = await response.json()
                        if (errorData.error === 'PRODUCT_LIMIT_EXCEEDED') {
                          setPlanLimits(errorData.limits)
                          setShowUpgradePopup(true)
                        } else {
                          showToast.error('❌ ' + (errorData.message || 'Import failed'))
                        }
                      } else {
                        showToast.error('❌ Import failed. Please check your CSV file format.')
                      }
                    } catch (error) {
                      showToast.error('❌ Import error. Please try again.')
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
                
                <BulkBarcodePrint products={inventory} />

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
                          showToast.success(`🗑️ Successfully cleared ${result.count} products from inventory!`)
                          fetchInventory()
                        } else {
                          showToast.error('❌ Failed to clear inventory. Please try again.')
                        }
                      } catch (error) {
                        showToast.error('❌ Error clearing inventory. Please check your connection.')
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
                    fetchSettings() // Refresh settings to get latest tax rate
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
                                <Input 
                                  id="barcode" 
                                  placeholder="Barcode number" 
                                  value={formData.barcode}
                                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                  className="flex-1 h-10" 
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-10 px-3"
                                  onClick={() => {
                                    const newBarcode = generateBarcode('FS')
                                    setFormData({...formData, barcode: newBarcode})
                                    showToast.success('Barcode generated!')
                                  }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              </div>
                              {formData.barcode && (
                                <div className="mt-2 p-2 border rounded">
                                  <BarcodeDisplay value={formData.barcode} height={30} fontSize={8} />
                                </div>
                              )}
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
                              <Label htmlFor="sellingPrice" className="text-sm font-medium">
                                Selling Price {settings.discountMode ? '(text minus)' : ''} *
                              </Label>
                              <div className="text-xs text-gray-500">
                                Mode: {settings.discountMode ? 'ON - Text Minus Active' : 'OFF - Normal Price'}
                              </div>
                              <Input 
                                id="sellingPrice" 
                                type="number" 
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => {
                                  const inputPrice = parseFloat(e.target.value) || 0
                                  
                                  if (settings.discountMode) {
                                    // When ON: Apply tax rate minus only if tax rate > 0
                                    const taxRate = settings.taxRate || 0
                                    if (taxRate > 0) {
                                      const finalSellingPrice = inputPrice - (inputPrice * (taxRate / 100))
                                      setFormData({...formData, price: e.target.value, finalPrice: finalSellingPrice.toFixed(2)})
                                    } else {
                                      // If tax rate is 0%, no deduction
                                      setFormData({...formData, price: e.target.value, finalPrice: e.target.value})
                                    }
                                  } else {
                                    // When OFF: Selling price = Final price
                                    setFormData({...formData, price: e.target.value, finalPrice: e.target.value})
                                  }
                                }}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="finalPrice" className="text-sm font-medium">
                                {settings.discountMode ? `Final Price (After ${settings.taxRate || 0}% minus)` : 'Final Price'}
                              </Label>
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
                      <Button onClick={createItem} className="px-6 bg-black hover:bg-black">
                        Add Product
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                  setIsEditDialogOpen(open)
                  if (open) {
                    fetchSettings() // Refresh settings to get latest tax rate
                  } else {
                    resetForm()
                  }
                }}>
                  <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b">
                      <DialogTitle className="text-xl font-semibold">Edit Clothing Item</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">Update clothing item details</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1 py-4">
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="editName" className="text-sm font-medium">Item Name *</Label>
                              <Input 
                                id="editName" 
                                placeholder="Enter item name" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editSku" className="text-sm font-medium">SKU</Label>
                              <Input 
                                id="editSku" 
                                placeholder="Item SKU" 
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editBarcode" className="text-sm font-medium">Barcode</Label>
                              <div className="flex space-x-2">
                                <Input 
                                  id="editBarcode" 
                                  placeholder="Barcode number" 
                                  value={formData.barcode}
                                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                  className="flex-1 h-10" 
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-10 px-3"
                                  onClick={() => {
                                    const newBarcode = generateBarcode('FS')
                                    setFormData({...formData, barcode: newBarcode})
                                    showToast.success('New barcode generated!')
                                  }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              </div>
                              {formData.barcode && (
                                <div className="mt-2 p-2 border rounded">
                                  <BarcodeDisplay value={formData.barcode} height={30} fontSize={8} />
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editCategory" className="text-sm font-medium">Category *</Label>
                              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
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
                              <Label htmlFor="editSize" className="text-sm font-medium">Size</Label>
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
                              <Label htmlFor="editMaterial" className="text-sm font-medium">Material</Label>
                              <Select value={formData.material} onValueChange={(value) => setFormData({...formData, material: value})}>
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
                              <Label htmlFor="editBrand" className="text-sm font-medium">Brand</Label>
                              <Select value={formData.brand} onValueChange={(value) => setFormData({...formData, brand: value})}>
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
                              <Label htmlFor="editCostPrice" className="text-sm font-medium">Cost Price</Label>
                              <Input 
                                id="editCostPrice" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.costPrice}
                                onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editPrice" className="text-sm font-medium">
                                Selling Price {settings.discountMode ? '(text minus)' : ''} *
                              </Label>
                              <div className="text-xs text-gray-500">
                                Mode: {settings.discountMode ? 'ON - Text Minus Active' : 'OFF - Normal Price'}
                              </div>
                              <Input 
                                id="editPrice" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.price}
                                onChange={(e) => {
                                  const inputPrice = parseFloat(e.target.value) || 0
                                  
                                  if (settings.discountMode) {
                                    // When ON: Apply tax rate minus only if tax rate > 0
                                    const taxRate = settings.taxRate || 0
                                    if (taxRate > 0) {
                                      const finalSellingPrice = inputPrice - (inputPrice * (taxRate / 100))
                                      setFormData({...formData, price: e.target.value, finalPrice: finalSellingPrice.toFixed(2)})
                                    } else {
                                      // If tax rate is 0%, no deduction
                                      setFormData({...formData, price: e.target.value, finalPrice: e.target.value})
                                    }
                                  } else {
                                    setFormData({...formData, price: e.target.value, finalPrice: e.target.value})
                                  }
                                }}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editFinalPrice" className="text-sm font-medium">
                                {settings.discountMode ? `Final Price (After ${settings.taxRate || 0}% minus)` : 'Final Price'}
                              </Label>
                              <Input 
                                id="editFinalPrice" 
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
                              <Label htmlFor="editStock" className="text-sm font-medium">Current Stock *</Label>
                              <Input 
                                id="editStock" 
                                type="number" 
                                placeholder="0" 
                                value={formData.stock}
                                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editMinStock" className="text-sm font-medium">Minimum Stock</Label>
                              <Input 
                                id="editMinStock" 
                                type="number" 
                                placeholder="0" 
                                value={formData.minStock}
                                onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">Additional Details</h3>
                          <div className="space-y-2">
                            <Label htmlFor="editDescription" className="text-sm font-medium">Description</Label>
                            <Textarea 
                              id="editDescription" 
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
                      <Button variant="outline" onClick={() => {
                        setIsEditDialogOpen(false)
                        resetForm()
                      }} className="px-6">
                        Cancel
                      </Button>
                      <Button onClick={updateItem} className="px-6 bg-black hover:bg-black">
                        Update Product
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Product</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {itemToDelete?.name}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={deleteItem}>
                        Delete
                      </Button>
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
                      <TableHead className="text-center">Barcode</TableHead>
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
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-xs">{(item as any).barcode || 'No Barcode'}</span>
                            {(item as any).barcode && (
                              <BarcodeDisplay value={(item as any).barcode} height={20} fontSize={6} />
                            )}
                          </div>
                        </TableCell>
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
                            {(item as any).barcode && (
                              <QuantityBarcodePrint product={item} />
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => openDeleteDialog(item)}
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
