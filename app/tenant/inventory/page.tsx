"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store-context"
import { MainLayout } from "@/components/layout/main-layout"
import { FeatureGuard } from "@/components/feature-guard"
import { useLanguage } from "@/lib/language-context"
import { useDynamicTranslation } from "@/hooks/use-dynamic-translation"
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
import { DynamicInventoryForm } from "@/components/dynamic-inventory-form"

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
  const { t, language } = useLanguage()
  const { translateText } = useDynamicTranslation()
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
  const [tenantFields, setTenantFields] = useState<Array<{name: string, type: string, enabled: boolean}>>([])
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const { storeName, tenantId } = useStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  const fetchInventory = async (page = 1) => {
    try {
      const response = await fetch(`/api/inventory?page=${page}&limit=${itemsPerPage}`)
      if (response.ok) {
        const result = await response.json()
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
          return result.data || []
        }
        return result.data || result || []
      }
    } catch (error) {
      console.warn('Inventory API unavailable:', error)
    }
    return []
  }

  const fetchDropdownData = async () => {
    try {
      const response = await fetch('/api/dropdown-data')
      if (response.ok) {
        const data = await response.json()
        return {
          categories: data.categories || [],
          sizes: data.sizes || [],
          colors: data.colors || [],
          materials: data.materials || [],
          brands: data.brands || []
        }
      }
    } catch (error) {
      console.warn('Dropdown data API unavailable:', error)
    }
    return {
      categories: [],
      sizes: [],
      colors: [],
      materials: [],
      brands: []
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        return { taxRate: data.taxRate ?? 0, discountMode: data.discountMode || false }
      }
    } catch (error) {
      console.warn('Settings API unavailable:', error)
    }
    return { taxRate: 0, discountMode: false }
  }

  const fetchPlanLimits = async () => {
    try {
      const response = await fetch('/api/plan-limits')
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.warn('Plan limits API unavailable:', error)
    }
    return null
  }

  const fetchTenantFields = async () => {
    try {
      const response = await fetch('/api/tenant-fields')
      if (response.ok) {
        const data = await response.json()
        return data.fields?.filter((f: any) => f.enabled) || []
      }
    } catch (error) {
      console.warn('Tenant fields API unavailable:', error)
    }
    return []
  }

  const filterDropdownsByCategory = (category: string) => {
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

  const createItem = async () => {
    try {
      const requestData = { ...formData }
      
      const requestDataAny = requestData as any
      const productName = requestDataAny.name || requestDataAny.productname || requestDataAny['Product Name'] || requestDataAny.medicine || requestDataAny.ProductName
      if (!productName || !productName.toString().trim()) {
        showToast.error('❌ Product name is required')
        return
      }
      
      if (!requestDataAny.name) {
        requestDataAny.name = productName
      }
      
      if (!requestData.sku || !requestData.sku.trim()) {
        requestData.sku = `SKU-${Date.now()}`
      }

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      if (response.ok) {
        const [inventoryData, planLimitsData] = await Promise.all([
          fetchInventory(),
          fetchPlanLimits()
        ])
        setInventory(inventoryData)
        setPlanLimits(planLimitsData)
        setIsAddDialogOpen(false)
        resetForm()
        showToast.success(language === 'en' ? '✅ Product added to inventory successfully!' : language === 'gu' ? '✅ પ્રોડક્ટ સફળતાપૂર્વક ઇન્વેન્ટરીમાં ઉમેરાયું!' : '✅ उत्पाद सफलतापूर्वक इन्वेंटरी में जोड़ा गया!')
      } else {
        const errorData = await response.json()
        
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

  const updateItem = async () => {
    if (!selectedItem) return
    try {
      const requestData = { ...formData }
      
      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      if (response.ok) {
        const inventoryData = await fetchInventory()
        setInventory(inventoryData)
        setIsEditDialogOpen(false)
        resetForm()
        showToast.success(language === 'en' ? '✅ Product updated successfully!' : language === 'gu' ? '✅ પ્રોડક્ટ સફળતાપૂર્વક અપડેટ થયું!' : '✅ उत्पाद सफलतापूर्वक अपडेट हुआ!')
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
        const inventoryData = await fetchInventory()
        setInventory(inventoryData)
        setIsDeleteDialogOpen(false)
        setItemToDelete(null)
        showToast.success(language === 'en' ? 'Product deleted successfully!' : language === 'gu' ? 'પ્રોડક્ટ સફળતાપૂર્વક ડિલીટ થયું!' : 'उत्पाद सफलतापूर्वक हटाया गया!')
      } else {
        showToast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      showToast.error('Error deleting product')
    }
  }

  const resetForm = () => {
    const emptyFormData: any = {
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
    }
    
    tenantFields.forEach(field => {
      const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
      emptyFormData[fieldKey] = ''
      emptyFormData[field.name] = ''
      emptyFormData[field.name.toLowerCase()] = ''
    })
    
    setFormData(emptyFormData)
    setSelectedItem(null)
  }

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    const currentPrice = (item.price ?? 0).toString()
    
    const editFormData: any = {
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
    }
    
    tenantFields.forEach(field => {
      const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
      let value = (item as any)[fieldKey] || (item as any)[field.name] || (item as any)[field.name.toLowerCase()] || ''
      
      if (field.name.toLowerCase().includes('productname') || field.name.toLowerCase().includes('product_name')) {
        value = item.name || value
      }
      
      editFormData[fieldKey] = Array.isArray(value) ? value.join(', ') : value.toString()
      editFormData[field.name] = editFormData[fieldKey]
      editFormData[field.name.toLowerCase()] = editFormData[fieldKey]
      editFormData['ProductName'] = item.name || ''
      editFormData['productname'] = item.name || ''
      editFormData['product_name'] = item.name || ''
    })
    
    editFormData['ProductName'] = item.name || ''
    editFormData['productname'] = item.name || ''
    editFormData['product_name'] = item.name || ''
    
    setFormData(editFormData)
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [inventoryData, dropdownDataResult, settingsData, planLimitsData, tenantFieldsData] = await Promise.all([
          fetchInventory(),
          fetchDropdownData(),
          fetchSettings(),
          fetchPlanLimits(),
          fetchTenantFields()
        ])
        
        setInventory(inventoryData)
        setDropdownData(dropdownDataResult)
        setSettings(settingsData)
        setPlanLimits(planLimitsData)
        setTenantFields(tenantFieldsData)
        setFilteredDropdownData({
          sizes: dropdownDataResult.sizes || [],
          colors: dropdownDataResult.colors || [],
          materials: dropdownDataResult.materials || [],
          brands: dropdownDataResult.brands || []
        })
      } catch (error) {
        console.error('Error initializing data:', error)
      } finally {
        setLoading(false)
      }
    }
    initializeData()
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

  const paginatedInventory = filteredInventory

  useEffect(() => {
    setCurrentPage(1)
    fetchInventory(1).then(setInventory)
  }, [searchTerm, categoryFilter, stockFilter])

  useEffect(() => {
    fetchInventory(currentPage).then(setInventory)
  }, [currentPage])

  if (loading) {
    return (
      <MainLayout title={t('inventory')}>
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-10 bg-gray-200 rounded flex-1 max-w-sm animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const totalProducts = inventory.length
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock).length
  const totalValue = inventory.reduce((sum, item) => {
    const unitPrice = Number(item.price) || Number(item.costPrice) || 0;
    const stockQuantity = Number(item.stock) || 0;
    return sum + (stockQuantity * unitPrice);
  }, 0)

  return (
    <MainLayout title={t('inventory')}>
      <FeatureGuard feature="inventory">
        <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-4">
          <Card className={planLimits && totalProducts >= planLimits.maxProducts * 0.9 ? 'border-orange-200 bg-orange-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">{t('totalProducts')}</CardTitle>
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
              <CardTitle className="text-xl font-medium">{t('lowStock')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold ">{lowStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">{t('inventoryValue')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹   {totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">{t('categories')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(inventory.map((item) => item.category)).size}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('inventory')}</CardTitle>
                <CardDescription>{t('manageProductStock')}</CardDescription>
                {planLimits && totalProducts >= planLimits.maxProducts && (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      {t('productLimitReached')} ({totalProducts}/{planLimits.maxProducts})
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
                    {t('upgradePlan')}
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
                        const [inventoryData, planLimitsData] = await Promise.all([
                          fetchInventory(),
                          fetchPlanLimits()
                        ])
                        setInventory(inventoryData)
                        setPlanLimits(planLimitsData)
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
                  <Download className="w-4 h-4 mr-2" />
                  {importing ? t('importing') : t('importCSV')}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/api/inventory/export', '_blank')}
                >
                
                  <Upload className="w-4 h-4 mr-2" />
                  {t('exportCSV')}
                </Button>
                
                <BulkBarcodePrint products={inventory} />

                {selectedItems.length > 0 && (
                  <Button 
                    variant="destructive"
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedItems.length})
                  </Button>
                )}
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
                          const inventoryData = await fetchInventory()
                          setInventory(inventoryData)
                        } else {
                          showToast.error('❌ Failed to clear inventory. Please try again.')
                        }
                      } catch (error) {
                        showToast.error('❌ Error clearing inventory. Please check your connection.')
                      }
                    }
                  }}
                >
                  {t('clearAll')}
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      if (planLimits && totalProducts >= planLimits.maxProducts) {
                        setShowUpgradePopup(true)
                        return
                      }
                      resetForm()
                      setIsAddDialogOpen(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addProduct')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b">
                      <DialogTitle className="text-xl font-semibold">{language === 'en' ? 'Add New Product' : language === 'gu' ? 'નવું પ્રોડક્ટ ઉમેરો' : 'नया उत्पाद जोड़ें'}</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">{t('enterProductDetails')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1 py-4">
                      <div className="space-y-6">
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">{t('productInformation')}</h3>
                          <DynamicInventoryForm formData={formData} setFormData={(data) => setFormData(prev => ({...prev, ...data}))} />
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="px-6">
                        {t('cancel')}
                      </Button>
                      <Button onClick={createItem} className="px-6 bg-black hover:bg-gray-800">
                        {t('addProduct')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b">
                      <DialogTitle className="text-xl font-semibold">{language === 'en' ? 'Edit Product' : language === 'gu' ? 'પ્રોડક્ટ એડિટ કરો' : 'उत्पाद संपादित करें'}</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">{t('updateProductDetails')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1 py-4">
                      <div className="space-y-6">
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">{t('productInformation')}</h3>
                          <DynamicInventoryForm formData={formData} setFormData={(data) => setFormData(prev => ({...prev, ...data}))} />
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
                      <Button variant="outline" onClick={() => {
                        setIsEditDialogOpen(false)
                      }} className="px-6">
                        {t('cancel')}
                      </Button>
                      <Button onClick={updateItem} className="px-6 bg-black hover:bg-gray-800">
                        {t('updateProduct')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'en' ? 'Delete Product' : language === 'gu' ? 'પ્રોડક્ટ ડિલીટ કરો' : 'उत्पाद हटाएं'}</DialogTitle>
                      <DialogDescription>
                        {t('confirmDeleteProduct')} {itemToDelete?.name}? {t('actionCannotBeUndone')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        {t('cancel')}
                      </Button>
                      <Button variant="destructive" onClick={deleteItem}>
                        {t('delete')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Selected Products</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {selectedItems.length} selected products? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
                        {t('cancel')}
                      </Button>
                      <Button variant="destructive" onClick={async () => {
                        try {
                          await Promise.all(selectedItems.map(id => 
                            fetch(`/api/inventory/${id}`, { method: 'DELETE' })
                          ))
                          showToast.success(`${selectedItems.length} products deleted!`)
                          setSelectedItems([])
                          setIsBulkDeleteDialogOpen(false)
                          const inventoryData = await fetchInventory()
                          setInventory(inventoryData)
                        } catch (error) {
                          showToast.error('Error deleting products')
                        }
                      }}>
                        {t('delete')}
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
                  placeholder={language === 'en' ? 'Search Product...' : language === 'gu' ? 'પ્રોડક્ટ શોધો...' : 'उत्पाद खोजें...'}
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
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  {(dropdownData.categories || []).map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStock')}</SelectItem>
                  <SelectItem value="low">{t('lowStock')}</SelectItem>
                  <SelectItem value="normal">{t('normal')}</SelectItem>
                  <SelectItem value="high">{t('overstock')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('noProductsFound')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {inventory.length === 0 ? t('startByAddingFirstProduct') : t('tryAdjustingSearchFilters')}
                </p>
                <Button onClick={() => {
                  if (planLimits && totalProducts >= planLimits.maxProducts) {
                    setShowUpgradePopup(true)
                    return
                  }
                  setIsAddDialogOpen(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addFirstProduct')}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === paginatedInventory.length && paginatedInventory.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(paginatedInventory.map(item => item.id))
                            } else {
                              setSelectedItems([])
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </TableHead>
                      <TableHead className="text-center w-16">Sr. No.</TableHead>
                      {tenantFields.length > 0 ? (
                        <>
                          {tenantFields.map((field) => (
                            <TableHead key={field.name} className="text-center">{field.name}</TableHead>
                          ))}
                          <TableHead className="text-center">{t('stock')}</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="text-center">{t('name')}</TableHead>
                          <TableHead className="text-center">{t('sku')}</TableHead>
                          <TableHead className="text-center">{t('category')}</TableHead>
                          <TableHead className="text-center">{t('stock')}</TableHead>
                          <TableHead className="text-center">{t('price')}</TableHead>
                        </>
                      )}
                      <TableHead className="text-center">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventory.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item.id])
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== item.id))
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {((currentPage - 1) * itemsPerPage) + index + 1}
                        </TableCell>
                        {tenantFields.length > 0 ? (
                          <>
                            {tenantFields.map((field) => {
                              const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
                              let value = (item as any)[fieldKey] || (item as any)[field.name] || (item as any)[field.name.toLowerCase()]
                              
                              if (field.name.toLowerCase().includes('name') && !value) {
                                value = item.name
                              }
                              
                              const isBarcode = field.name.toLowerCase() === 'barcode' || field.type === 'barcode'
                              
                              return (
                                <TableCell key={field.name} className="text-center">
                                  {isBarcode && value ? (
                                    <BarcodeDisplay value={value} width={1.5} height={30} fontSize={10} />
                                  ) : (
                                    Array.isArray(value) ? value.join(', ') : (value || 'N/A')
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const stock = Number(item.stock) || 0
                                  const minStock = Number(item.minStock) || 0
                                  
                                  if (stock === 0) {
                                    return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                  } else if (stock <= minStock && minStock > 0) {
                                    return <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">Low Stock</Badge>
                                  } else {
                                    return <Badge variant="secondary" className="text-xs">In Stock</Badge>
                                  }
                                })()}
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-center">{item.name || t('unnamedProduct')}</TableCell>
                            <TableCell className="text-center">{item.sku || t('noSKU')}</TableCell>
                            <TableCell className="text-center">{item.category || t('noCategory')}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const stock = Number(item.stock) || 0
                                  const minStock = Number(item.minStock) || 0
                                  
                                  if (stock === 0) {
                                    return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                  } else if (stock <= minStock && minStock > 0) {
                                    return <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">Low Stock</Badge>
                                  } else {
                                    return <Badge variant="secondary" className="text-xs">In Stock</Badge>
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">₹{(item.price || 0).toFixed(2)}</TableCell>
                          </>
                        )}
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
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
        
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