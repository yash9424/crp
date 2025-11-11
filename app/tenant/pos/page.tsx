"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  ShoppingCart,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  Printer,
  Download,
  Pause,
  X,
  UserPlus,
  Edit,
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { FeatureGuard } from "@/components/feature-guard"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { useLanguage } from "@/lib/language-context"
import { translateName } from "@/lib/name-translator"

interface Product {
  id: string
  name: string
  sku: string
  price: number
  barcode: string
  category: string
  size?: string
  color?: string
  stock: number
  image?: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
}



export default function POSPage() {
  const { t, language } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [tenantFields, setTenantFields] = useState<any[]>([])
  const [settings, setSettings] = useState({ 
    storeName: 'Store', 
    taxRate: 10, 
    currency: 'INR',
    address: '',
    phone: '',
    gst: '',
    email: '',
    terms: '',
    whatsappMessage: '',
    deletePassword: 'admin123',
    billFormat: 'professional'
  })
  const [customerName, setCustomerName] = useState<string>("")
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [discount, setDiscount] = useState(0)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [heldBills, setHeldBills] = useState<any[]>([])
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash')
  const [customers, setCustomers] = useState<any[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '', address: '' })
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [barcodeBuffer, setBarcodeBuffer] = useState('')
  const [lastKeyTime, setLastKeyTime] = useState(0)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [whatsappStatus, setWhatsappStatus] = useState({ ready: false, hasQR: false })
  const [qrCode, setQrCode] = useState('')

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  // Check WhatsApp status
  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      const data = await response.json()
      setWhatsappStatus(data)
      
      // Always try to get QR if not ready
      if (!data.ready) {
        try {
          const qrResponse = await fetch('/api/whatsapp/status', { method: 'POST' })
          const qrData = await qrResponse.json()
          if (qrData.qr) {
            setQrCode(qrData.qr)
          }
        } catch (qrError) {
          console.log('QR fetch failed, retrying...')
        }
      }
    } catch (error) {
      console.log('Status check failed, service may be starting...')
      // Don't set error immediately, let it retry
    }
  }



  // Fetch tenant fields
  const fetchTenantFields = async () => {
    try {
      const response = await fetch('/api/tenant-fields')
      if (response.ok) {
        const data = await response.json()
        setTenantFields(data.fields || [])
      }
    } catch (error) {
      console.error('Failed to fetch tenant fields:', error)
    }
  }

  // Fetch products from inventory API
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        setProducts(data)
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search products locally
  const searchProducts = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products)
      return
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(query.toLowerCase())) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      ((product as any).brand && (product as any).brand.toLowerCase().includes(query.toLowerCase()))
    )
    setFilteredProducts(filtered)
  }

  useEffect(() => {
    fetchTenantFields()
    fetchProducts()
    fetchSettings()
    fetchCustomers()
    fetchEmployees()
    checkWhatsAppStatus()
    
    const interval = setInterval(checkWhatsAppStatus, 5000)
    
    // Set default WhatsApp message from settings
    if (settings.whatsappMessage) {
      setWhatsappMessage(settings.whatsappMessage)
    }
    
    // Listen for physical barcode scanner input
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime
      
      // If time between keystrokes is very short (< 50ms), it's likely a barcode scanner
      if (timeDiff < 50 && e.key !== 'Enter') {
        setBarcodeBuffer(prev => prev + e.key)
        setLastKeyTime(currentTime)
        e.preventDefault()
      } else if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        // Process the scanned barcode
        handleBarcodeScan(barcodeBuffer)
        setBarcodeBuffer('')
        e.preventDefault()
      } else if (timeDiff > 100) {
        // Reset buffer if too much time has passed
        setBarcodeBuffer(e.key === 'Enter' ? '' : e.key)
        setLastKeyTime(currentTime)
      }
    }
    
    // Add event listener for barcode scanner
    document.addEventListener('keypress', handleKeyPress)
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      clearInterval(interval)
    }
  }, [lastKeyTime, barcodeBuffer])

  useEffect(() => {
    searchProducts(searchTerm)
  }, [searchTerm, products])

  // Get field value using tenant configuration
  const getFieldValue = (product: any, fieldName: string) => {
    const field = tenantFields.find(f => f.name === fieldName)
    if (!field) return null
    
    // Try different field name variations
    return product[fieldName] || product[fieldName.toLowerCase()] || product[fieldName.replace(/\s+/g, '_').toLowerCase()] || null
  }

  const addToCart = (product: any) => {
    const displayPrice = product.price
    // Get product name from configured fields or fallback to productname
    let productName = 'Unnamed Product'
    if (tenantFields.length === 0) {
      productName = (product as any).productname || product.name || 'Unnamed Product'
    } else {
      const nameField = tenantFields.find(f => 
        f.name.toLowerCase() === 'medicine' || 
        f.name.toLowerCase() === 'product name' ||
        f.name.toLowerCase() === 'name' ||
        (f.name.toLowerCase().includes('name') && !f.name.toLowerCase().includes('id'))
      )
      productName = nameField ? getFieldValue(product, nameField.name) || (product as any).productname || product.name : (product as any).productname || product.name || 'Unnamed Product'
    }
    
    const existingItem = cart.find((item) => item.id === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * displayPrice }
            : item,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: productName,
          price: displayPrice,
          quantity: 1,
          total: displayPrice,
        },
      ])
    }
  }

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Search for product by barcode
      const product = products.find(p => p.barcode === barcode)
      
      if (product) {
        addToCart(product)
        showToast.success(`${t('added')} ${product.name} ${t('toCart')}`)
      } else {
        // Try to fetch from API if not in current products list
        const response = await fetch(`/api/pos/search?q=${encodeURIComponent(barcode)}`)
        if (response.ok) {
          const searchResults = await response.json()
          const foundProduct = searchResults.find((p: any) => p.barcode === barcode)
          
          if (foundProduct) {
            addToCart(foundProduct)
            showToast.success(`${t('added')} ${foundProduct.name} ${t('toCart')}`)
          } else {
            showToast.error(`${t('productNotFound')}: ${barcode}`)
          }
        } else {
          showToast.error(`${t('productNotFound')}: ${barcode}`)
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error)
      showToast.error(t('errorProcessingBarcode'))
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.id !== id))
    } else {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity, total: newQuantity * item.price } : item,
        ),
      )
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  const discountAmount = (subtotal * discount) / 100
  const tax = (subtotal - discountAmount) * (settings.taxRate / 100)
  const total = subtotal - discountAmount + tax

  const holdBill = () => {
    if (cart.length > 0) {
      const billId = `HOLD-${Date.now()}`
      setHeldBills([
        ...heldBills,
        {
          id: billId,
          items: [...cart],
          subtotal,
          discount,
          total,
          customerName,
          customerPhone,
          timestamp: new Date(),
        },
      ])
      setCart([])
      setDiscount(0)
      setCustomerName("")
      setCustomerPhone("")
    }
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setCustomerName("")
    setCustomerPhone("")
  }

  return (
    <MainLayout title={t('pos')}>
      <FeatureGuard feature="pos">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('customerInformation')}</CardTitle>
                {/* <Button variant="outline" size="sm" onClick={() => {
                  setEditingCustomer(null)
                  setCustomerFormData({ name: '', phone: '', email: '', address: '' })
                  setIsCustomerDialogOpen(true)
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffSelect">{t('staffMember')}</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectStaff')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      {Array.isArray(employees) && employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp.employeeId}>
                          {emp.name} ({emp.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">{t('customerName')}</Label>
                  <Input 
                    id="customerName" 
                    placeholder={t('enterCustomerName')} 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">{t('phoneNumber')}</Label>
                  <Input 
                    id="customerPhone" 
                    placeholder={t('enterPhoneNumber')} 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('productSelection')}</CardTitle>
                  <CardDescription>{t('searchAndAddProducts')}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {t('scanBarcode')}
                  </Button>
                  {barcodeBuffer && (
                    <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {t('scanning')}: {barcodeBuffer}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchByNameSKU')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      // If search term looks like a barcode (numbers/alphanumeric), focus on exact match
                      const isBarcode = /^[A-Za-z0-9]+$/.test(searchTerm.trim())
                      if (isBarcode) {
                        handleBarcodeScan(searchTerm.trim())
                        setSearchTerm('')
                      } else if (filteredProducts.length === 1) {
                        addToCart(filteredProducts[0])
                        setSearchTerm('')
                      }
                    }
                  }}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">{t('loadingProducts')}</div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {Array.isArray(filteredProducts) && filteredProducts.map((product) => {
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {(() => {
                              // If tenant fields not loaded yet, use productname field directly
                              if (tenantFields.length === 0) {
                                return (product as any).productname || product.name || 'No Name'
                              }
                              // Look for the actual product name field, not just any field with 'name'
                              const nameField = tenantFields.find(f => 
                                f.name.toLowerCase() === 'medicine' || 
                                f.name.toLowerCase() === 'product name' ||
                                f.name.toLowerCase() === 'name' ||
                                (f.name.toLowerCase().includes('name') && !f.name.toLowerCase().includes('id'))
                              )
                              const result = nameField ? getFieldValue(product, nameField.name) || 'No Name' : (product as any).productname || product.name || 'No Name'
                              return result
                            })()}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t('stock')}: {product.stock || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹ {((product as any).Price || (product as any).price || product.price || 0).toFixed(2)}</p>
                          <Badge variant="outline" className="text-xs">
                            {(product as any).Barcode || (product as any).barcode || product.barcode || t('noBarcode')}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Held Bills */}
          {heldBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('heldBills')} ({heldBills.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {heldBills.map((bill) => (
                    <Button
                      key={bill.id}
                      variant="outline"
                      className="w-full justify-between bg-transparent"
                      onClick={() => {
                        setCart(bill.items)
                        setDiscount(bill.discount)
                        setCustomerName(bill.customerName || "")
                        setCustomerPhone(bill.customerPhone || "")
                        setHeldBills(heldBills.filter((b) => b.id !== bill.id))
                      }}
                    >
                      <span>{bill.id}</span>
                      <span>₹ {bill.total.toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>{t('cart')} ({cart.length})</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={holdBill}>
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    {t('clearCart')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('cartIsEmpty')}</p>
              ) : (
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h5 className="font-medium text-sm leading-tight">{item.name}</h5>
                          {editingItemId === item.id ? (
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              onBlur={() => {
                                if (editPrice && !isNaN(Number(editPrice))) {
                                  const updatedPrice = Number(editPrice)
                                  setCart(cart.map(cartItem => 
                                    cartItem.id === item.id 
                                      ? { ...cartItem, price: updatedPrice, total: updatedPrice * cartItem.quantity }
                                      : cartItem
                                  ))
                                }
                                setEditingItemId(null)
                                setEditPrice('')
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                }
                              }}
                              className="text-xs h-6 w-20"
                              autoFocus
                            />
                          ) : (
                            <p 
                              className="text-xs text-muted-foreground cursor-pointer" 
                              onClick={() => {
                                setEditingItemId(item.id)
                                setEditPrice(item.price.toString())
                              }}
                            >
                              ₹ {item.price.toFixed(2)} {t('each')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">₹ {item.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>

                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>WhatsApp Login</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whatsappStatus.ready ? (
                <div className="text-center space-y-2">
                  <div className="text-green-600 font-medium">✅ Logged In</div>
                  <p className="text-xs text-muted-foreground">Ready to send messages</p>
                </div>
              ) : qrCode ? (
                <div className="text-center space-y-2">
                  <img src={qrCode} alt="WhatsApp QR" className="mx-auto max-w-40" />
                  <p className="text-xs text-muted-foreground">Scan with WhatsApp</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-yellow-600 font-medium">⏳ Loading QR...</div>
                  <p className="text-xs text-muted-foreground">Starting WhatsApp service</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer & Billing */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customerAndBilling')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              <div className="space-y-2">
                <Label htmlFor="discount">{t('discount')} (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('subtotal')}:</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('discount')} ({discount}%):</span>
                    <span>-₹ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {settings.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{t('tax')}:</span>
                    <span>₹ {tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}:</span>
                  <span>₹ {total.toFixed(2)}</span>
                </div>
              </div>

              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={cart.length === 0}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('processPayment')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('paymentProcessing')}</DialogTitle>
                    <DialogDescription>{t('completeTransaction')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">₹ {total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('cash')}
                      >
                        <Banknote className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">{t('cash')}</span>
                      </Button>
                      <Button 
                        variant={selectedPaymentMethod === 'online' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('online')}
                      >
                        <Smartphone className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">{t('online')}</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amountReceived">{t('amountReceived')}</Label>
                      <Input id="amountReceived" type="number" placeholder={total.toFixed(2)} />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          try {
                            // Create/update customer first
                            if (customerName.trim()) {
                              try {
                                const customerResponse = await fetch('/api/customers', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name: customerName.trim(),
                                    phone: customerPhone?.trim() || null
                                  })
                                })
                                if (!customerResponse.ok) {
                                  console.error('Failed to create/update customer')
                                }
                              } catch (error) {
                                console.error('Customer API error:', error)
                              }
                            }
                            
                            const saleData = {
                              items: cart.map(item => ({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                                total: item.total
                              })),
                              customerName,
                              customerPhone,
                              subtotal,
                              discount,
                              discountAmount,
                              tax,
                              total,
                              paymentMethod: selectedPaymentMethod,
                              taxRate: settings.taxRate,
                              storeName: settings.storeName,
                              staffMember: selectedStaff || 'admin'
                            }
                            
                            const response = await fetch('/api/pos/sales', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(saleData)
                            })
                            
                            if (response.ok) {
                              const result = await response.json()
                              setCompletedSale({
                                ...result,
                                date: new Date(result.createdAt),
                                items: cart
                              })
                              setIsPaymentDialogOpen(false)
                              setIsBillModalOpen(true)
                              fetchProducts()
                              showToast.success(language === 'en' ? 'Sale completed successfully!' : language === 'gu' ? 'વેચાણ સફળતાપૂર્વક પૂર્ણ થયું!' : 'बिक्री सफलतापूर्वक पूर्ण हुई!')
                            } else {
                              const errorData = await response.json()
                              showToast.error(`${t('failedToProcessSale')}: ${errorData.error || t('unknownError')}`)
                              console.error('Sale error:', errorData)
                            }
                          } catch (error) {
                            console.error('Failed to process sale:', error)
                            showToast.error(`${t('networkError')}: ${t('failedToProcessSale')}`)
                          }
                        }}
                      >
                        {t('completeSale')}
                      </Button>
                      
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bill Modal */}
      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('saleComplete')}</DialogTitle>
            <DialogDescription>{t('transactionCompleted')}</DialogDescription>
          </DialogHeader>
          {completedSale && completedSale.billNo && (
            <div className="py-4 max-h-[70vh] overflow-y-auto">
              {/* Bill Receipt */}
              <div id="bill-receipt" className="bg-white text-black font-mono" style={{width: '100%', maxWidth: '300px', fontSize: '12px', lineHeight: '1.2', padding: '4px', boxSizing: 'border-box'}}>
                {/* Store Header */}
                <div className="text-center pb-3 mb-3" style={{borderBottom: '2px dashed #000'}}>
                  <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '4px'}}>{(completedSale.storeName || settings.storeName).toUpperCase()}</div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>{completedSale.address || settings.address || t('storeAddress')}</div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>{t('phone')}: {completedSale.phone || settings.phone || '+91-9876543210'}</div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>GST: {completedSale.gst || settings.gst || t('gstNumber')}</div>
                  <div style={{fontSize: '10px'}}>{t('email')}: {completedSale.email || settings.email || 'store@email.com'}</div>
                </div>
                
                {/* Bill Details */}
                <div className="mb-3">
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px'}}>
                    <span>{t('billNo')}: {completedSale.billNo}</span>
                    <span>{completedSale.date.toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>
                    {t('time')}: {completedSale.date.toLocaleTimeString('en-IN', {hour12: true})}
                  </div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>
                    {t('cashier')}: Admin
                  </div>
                  {completedSale.customerName && (
                    <div style={{marginTop: '8px', paddingTop: '4px', borderTop: '1px solid #ccc'}}>
                      <div style={{fontSize: '10px', marginBottom: '2px'}}>{t('customer')}: {completedSale.customerName}</div>
                      {completedSale.customerPhone && <div style={{fontSize: '10px'}}>{t('phone')}: {completedSale.customerPhone}</div>}
                    </div>
                  )}
                </div>

                {/* Items Header */}
                <div style={{borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px'}}>
                  <div style={{display: 'flex', fontSize: '8px', fontWeight: 'bold'}}>
                    <span style={{width: '35%'}}>{t('item').toUpperCase()}</span>
                    <span style={{width: '15%', textAlign: 'center'}}>{t('qty').toUpperCase()}</span>
                    <span style={{width: '25%', textAlign: 'right'}}>{t('rate').toUpperCase()}</span>
                    <span style={{width: '25%', textAlign: 'right'}}>{t('amount').toUpperCase()}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-3">
                  {completedSale.items.map((item: any, index: number) => (
                    <div key={index} style={{marginBottom: '6px'}}>
                      <div style={{fontSize: '8px', fontWeight: '500', marginBottom: '2px'}}>
                        {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                      </div>
                      <div style={{display: 'flex', fontSize: '8px'}}>
                        <span style={{width: '35%'}}></span>
                        <span style={{width: '15%', textAlign: 'center'}}>{item.quantity}</span>
                        <span style={{width: '25%', textAlign: 'right', paddingRight: '10px'}}>₹{item.price.toFixed(2)}</span>
                        <span style={{width: '25%', textAlign: 'right', fontWeight: '500'}}>₹{item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div style={{borderTop: '1px dashed #000', paddingTop: '4px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px'}}>
                    <span>{t('subtotal')}:</span>
                    <span>₹{(completedSale.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: '#059669'}}>
                      <span>{t('discount')} ({completedSale.discount}%):</span>
                      <span>-₹{(completedSale.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(completedSale.taxRate || settings.taxRate) > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px'}}>
                      <span>{t('tax')}:</span>
                      <span>₹{(completedSale.tax || 0).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold'}}>
                      <span>{t('total').toUpperCase()}:</span>
                      <span>₹{(completedSale.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px'}}>
                    <span>{t('paymentMode')}:</span>
                    <span>{t('cash')}</span>
                  </div>
                </div>

                {/* Terms & Conditions */}
                {(completedSale.terms || settings.terms) && (
                  <div className="mt-3 pt-2" style={{borderTop: '1px dashed #000'}}>
                    <div style={{fontSize: '8px', fontWeight: '500', marginBottom: '2px'}}>{t('termsConditions')}:</div>
                    <div style={{fontSize: '7px', lineHeight: '1.3'}}>
                      {completedSale.terms || settings.terms}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center mt-4 pt-3" style={{borderTop: '2px dashed #000'}}>
                  <div style={{fontSize: '10px', marginBottom: '2px', fontWeight: '500'}}>{t('thankYouShopping')}</div>
                  <div style={{fontSize: '9px', marginBottom: '2px'}}>{t('visitAgain')}</div>
                  <div style={{fontSize: '9px'}}>{t('forSupport')}: {completedSale.phone || settings.phone || '+91-9876543210'}</div>
                  <div style={{marginTop: '8px', fontSize: '8px'}}>{t('poweredBy')}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4 no-print">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    // Hide action buttons during print
                    const actionButtons = document.querySelector('.no-print') as HTMLElement
                    if (actionButtons) actionButtons.style.display = 'none'
                    
                    const printContent = document.getElementById('bill-receipt')?.innerHTML
                    const printWindow = window.open('', '_blank')
                    if (printWindow && printContent) {
                      // Remove tax line from print content if tax rate is 0
                      let modifiedPrintContent = printContent
                      if ((completedSale.taxRate || settings.taxRate) === 0) {
                        // Remove the tax line that contains "Tax (" from the print content
                        modifiedPrintContent = printContent
                          ?.replace(/<div[^>]*>\s*<span>Tax \([^<]*<\/span>\s*<span>[^<]*<\/span>\s*<\/div>/gi, '')
                          ?.replace(/Tax \([^\n]*\n?/gi, '')
                      }
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Fashion Store - Receipt</title>
                            <style>
                              * { 
                                margin: 0; 
                                padding: 0; 
                                box-sizing: border-box; 
                                color: #000000 !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              body { 
                                font-family: 'Courier New', monospace; 
                                margin: 0; 
                                padding: 0;
                                background: white !important;
                                color: #000000 !important;
                                line-height: 1.3;
                                width: 100%;
                                font-weight: bold !important;
                              }
                              @media print { 
                                * {
                                  color: #000000 !important;
                                  background: transparent !important;
                                  font-weight: bold !important;
                                }
                                body { 
                                  margin: 0 !important; 
                                  padding: 0 !important;
                                  color: #000000 !important;
                                  background: white !important;
                                  font-weight: bold !important;
                                }
                                @page {
                                  size: 80mm auto;
                                  margin: 2mm !important;
                                }
                                .no-print { display: none !important; }
                              }
                              .receipt {
                                width: 100%;
                                max-width: 80mm;
                                margin: 0;
                                padding: 2mm;
                                font-size: 14px;
                                box-sizing: border-box;
                                color: #000000 !important;
                                font-weight: bold !important;
                              }
                              div, span, p {
                                color: #000000 !important;
                                font-weight: bold !important;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="receipt">${modifiedPrintContent}</div>
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      printWindow.print()
                      printWindow.close()
                    }
                    
                    // Show action buttons again after print
                    if (actionButtons) actionButtons.style.display = 'flex'
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {t('printBill')}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    if (!completedSale.customerPhone) {
                      showToast.error(t('customerPhoneRequired'))
                      return
                    }
                    
                    try {
                      const billFormat = settings.billFormat || 'professional'
                      let pdfLink
                      if (billFormat === 'simple') {
                        pdfLink = `${window.location.origin}/api/receipt-simple-public/${completedSale._id || completedSale.id}`
                      } else if (billFormat === 'invoice') {
                        pdfLink = `${window.location.origin}/api/public-receipt/${completedSale._id || completedSale.id}`
                      } else {
                        pdfLink = `${window.location.origin}/api/public-receipt/${completedSale._id || completedSale.id}`
                      }
                      
                      const billMessage = `*${(settings.storeName || 'STORE').toUpperCase()}*

*Bill No:* ${completedSale.billNo}
*Customer:* ${completedSale.customerName}
*Date:* ${completedSale.date.toLocaleDateString('en-IN')}
*Time:* ${completedSale.date.toLocaleTimeString('en-IN', {hour12: true})}

*ITEMS PURCHASED:*
${completedSale.items.map((item: any) => `• ${item.name} x${item.quantity} = Rs${item.total.toFixed(2)}`).join('\n')}

*Subtotal:* Rs${(completedSale.subtotal || 0).toFixed(2)}
*Discount:* Rs${(completedSale.discountAmount || 0).toFixed(2)}
*Tax:* Rs${(completedSale.tax || 0).toFixed(2)}
*TOTAL AMOUNT: Rs${completedSale.total.toFixed(2)}*
*Payment Method:* ${completedSale.paymentMethod || 'Cash'}

*Download Your Bill:*
${pdfLink}

Thanks for shopping!
Come again!

${settings.address || 'Store Address'}
Contact: ${settings.phone || '9427300816'}`

                      // Send via WhatsApp microservice
                      const response = await fetch('/api/send-bill', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          phone: completedSale.customerPhone.replace(/[^\d]/g, ''),
                          message: billMessage
                        })
                      })
                      
                      if (response.ok) {
                        showToast.success('Bill sent via WhatsApp successfully!')
                      } else {
                        const error = await response.json()
                        showToast.error(`Failed to send: ${error.error || 'Unknown error'}`)
                      }
                    } catch (error) {
                      showToast.error(t('failedToSendWhatsApp'))
                      console.error('WhatsApp error:', error)
                    }
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {t('sendWhatsApp')}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsBillModalOpen(false)
                    clearCart()
                  }}
                >
                  {t('newSale')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
      </FeatureGuard>
    </MainLayout>
  )
}
