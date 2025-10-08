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
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
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
    deletePassword: 'admin123'
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
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/pos/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search products
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products)
      return
    }
    
    try {
      const response = await fetch(`/api/pos/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error('Failed to search products:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchSettings()
    fetchCustomers()
    fetchEmployees()
    
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
    }
  }, [lastKeyTime, barcodeBuffer])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchProducts(searchTerm)
    }, 300)
    
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, products])

  const addToCart = (product: any) => {
    const displayPrice = product.price
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
          name: product.name,
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
        showToast.success(`Added ${product.name} to cart`)
      } else {
        // Try to fetch from API if not in current products list
        const response = await fetch(`/api/pos/search?q=${encodeURIComponent(barcode)}`)
        if (response.ok) {
          const searchResults = await response.json()
          const foundProduct = searchResults.find((p: any) => p.barcode === barcode)
          
          if (foundProduct) {
            addToCart(foundProduct)
            showToast.success(`Added ${foundProduct.name} to cart`)
          } else {
            showToast.error(`Product not found for barcode: ${barcode}`)
          }
        } else {
          showToast.error(`Product not found for barcode: ${barcode}`)
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error)
      showToast.error('Error processing barcode scan')
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
    <MainLayout title="Fashion Point of Sale" userRole="tenant-admin">
      <FeatureGuard feature="pos">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Information</CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffSelect">Staff Member</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp.employeeId}>
                          {emp.name} ({emp.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input 
                    id="customerName" 
                    placeholder="Enter customer name" 
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      setShowCustomerSuggestions(e.target.value.length > 0)
                    }}
                    onFocus={() => setShowCustomerSuggestions(customerName.length > 0)}
                    onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                  />
                  {showCustomerSuggestions && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {customers
                        .filter(customer => 
                          customer.name.toLowerCase().includes(customerName.toLowerCase()) ||
                          (customer.phone && customer.phone.includes(customerName))
                        )
                        .slice(0, 5)
                        .map(customer => (
                          <div
                            key={customer.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setCustomerName(customer.name)
                              setCustomerPhone(customer.phone || '')
                              setShowCustomerSuggestions(false)
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500">
                                  {customer.phone} • {customer.orderCount} orders
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingCustomer(customer)
                                  setCustomerFormData({
                                    name: customer.name,
                                    phone: customer.phone || '',
                                    email: customer.email || '',
                                    address: customer.address || ''
                                  })
                                  setIsCustomerDialogOpen(true)
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input 
                    id="customerPhone" 
                    placeholder="Enter phone number" 
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
                  <CardTitle>Clothing Selection</CardTitle>
                  <CardDescription>Search and add clothing items to cart</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Scan Barcode
                  </Button>
                  {barcodeBuffer && (
                    <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      Scanning: {barcodeBuffer}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, barcode, or category..."
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
                <div className="text-center py-8">Loading products...</div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {product.category} • Size: {product.size || 'N/A'} • Brand: {(product as any).brand || 'N/A'} • Stock: {product.stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹ {product.price}</p>
                      <Badge variant="outline" className="text-xs">
                        {product.barcode}
                      </Badge>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Held Bills */}
          {heldBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Held Bills ({heldBills.length})</CardTitle>
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
                  <span>Cart ({cart.length})</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={holdBill}>
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
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
                              ₹ {item.price} each
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">₹ {item.total}</p>
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

          {/* Customer & Billing */}
          <Card>
            <CardHeader>
              <CardTitle>Customer & Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
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
                  <span>Subtotal:</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount}%):</span>
                    <span>-₹ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {settings.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>₹ {tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹ {total.toFixed(2)}</span>
                </div>
              </div>

              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={cart.length === 0}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Process Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Payment Processing</DialogTitle>
                    <DialogDescription>Complete the transaction</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">₹ {total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button 
                        variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('cash')}
                      >
                        <Banknote className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Cash</span>
                      </Button>
                      <Button 
                        variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('card')}
                      >
                        <CreditCard className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Card</span>
                      </Button>
                      <Button 
                        variant={selectedPaymentMethod === 'upi' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('upi')}
                      >
                        <Smartphone className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">UPI</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amountReceived">Amount Received</Label>
                      <Input id="amountReceived" type="number" placeholder={total.toFixed(2)} />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          try {
                            // Create/update customer first
                            if (customerName.trim()) {
                              await fetch('/api/customers', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  name: customerName,
                                  phone: customerPhone
                                })
                              })
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
                              showToast.success('Sale completed successfully!')
                            } else {
                              const errorData = await response.json()
                              showToast.error(`Failed to process sale: ${errorData.error || 'Unknown error'}`)
                              console.error('Sale error:', errorData)
                            }
                          } catch (error) {
                            console.error('Failed to process sale:', error)
                            showToast.error('Network error: Failed to process sale')
                          }
                        }}
                      >
                        Complete Sale
                      </Button>
                      <Button variant="outline">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4" />
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
            <DialogTitle>Sale Complete</DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>
          {completedSale && completedSale.billNo && (
            <div className="py-4 max-h-[70vh] overflow-y-auto">
              {/* Bill Receipt */}
              <div id="bill-receipt" className="bg-white text-black font-mono" style={{width: '100%', maxWidth: '300px', fontSize: '12px', lineHeight: '1.2', padding: '4px', boxSizing: 'border-box'}}>
                {/* Store Header */}
                <div className="text-center pb-3 mb-3" style={{borderBottom: '2px dashed #000'}}>
                  <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '4px'}}>{(completedSale.storeName || settings.storeName).toUpperCase()}</div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>{completedSale.address || settings.address || 'Store Address'}</div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>Phone: {completedSale.phone || settings.phone || '+91-9876543210'}</div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>GST: {completedSale.gst || settings.gst || 'GST Number'}</div>
                  <div style={{fontSize: '10px'}}>Email: {completedSale.email || settings.email || 'store@email.com'}</div>
                </div>
                
                {/* Bill Details */}
                <div className="mb-3">
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px'}}>
                    <span>Bill No: {completedSale.billNo}</span>
                    <span>{completedSale.date.toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>
                    Time: {completedSale.date.toLocaleTimeString('en-IN', {hour12: true})}
                  </div>
                  <div style={{fontSize: '10px', marginBottom: '2px'}}>
                    Cashier: Admin
                  </div>
                  {completedSale.customerName && (
                    <div style={{marginTop: '8px', paddingTop: '4px', borderTop: '1px solid #ccc'}}>
                      <div style={{fontSize: '10px', marginBottom: '2px'}}>Customer: {completedSale.customerName}</div>
                      {completedSale.customerPhone && <div style={{fontSize: '10px'}}>Phone: {completedSale.customerPhone}</div>}
                    </div>
                  )}
                </div>

                {/* Items Header */}
                <div style={{borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold'}}>
                    <span style={{width: '45%'}}>ITEM</span>
                    <span style={{width: '15%', textAlign: 'center'}}>QTY</span>
                    <span style={{width: '20%', textAlign: 'right'}}>RATE</span>
                    <span style={{width: '20%', textAlign: 'right'}}>AMOUNT</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-3">
                  {completedSale.items.map((item: any, index: number) => (
                    <div key={index} style={{marginBottom: '6px'}}>
                      <div style={{fontSize: '10px', fontWeight: '500', marginBottom: '2px'}}>
                        {item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name}
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px'}}>
                        <span style={{width: '45%'}}></span>
                        <span style={{width: '15%', textAlign: 'center'}}>{item.quantity}</span>
                        <span style={{width: '20%', textAlign: 'right'}}>₹{item.price.toFixed(2)}</span>
                        <span style={{width: '20%', textAlign: 'right', fontWeight: '500'}}>₹{item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div style={{borderTop: '1px dashed #000', paddingTop: '4px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px'}}>
                    <span>Subtotal:</span>
                    <span>₹{(completedSale.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: '#059669'}}>
                      <span>Discount ({completedSale.discount}%):</span>
                      <span>-₹{(completedSale.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(completedSale.taxRate || settings.taxRate) > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px'}}>
                      <span>Tax:</span>
                      <span>₹{(completedSale.tax || 0).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold'}}>
                      <span>TOTAL:</span>
                      <span>₹{(completedSale.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px'}}>
                    <span>Payment Mode:</span>
                    <span>Cash</span>
                  </div>
                </div>

                {/* Terms & Conditions */}
                {(completedSale.terms || settings.terms) && (
                  <div className="mt-3 pt-2" style={{borderTop: '1px dashed #000'}}>
                    <div style={{fontSize: '8px', fontWeight: '500', marginBottom: '2px'}}>Terms & Conditions:</div>
                    <div style={{fontSize: '7px', lineHeight: '1.3'}}>
                      {completedSale.terms || settings.terms}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center mt-4 pt-3" style={{borderTop: '2px dashed #000'}}>
                  <div style={{fontSize: '10px', marginBottom: '2px', fontWeight: '500'}}>Thank you for shopping with us!</div>
                  <div style={{fontSize: '9px', marginBottom: '2px'}}>Visit again soon</div>
                  <div style={{fontSize: '9px'}}>For support: {completedSale.phone || settings.phone || '+91-9876543210'}</div>
                  <div style={{marginTop: '8px', fontSize: '8px'}}>Powered by Fashion POS System</div>
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
                  Print Bill
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (!completedSale.customerPhone) {
                      showToast.error('Customer phone number required for WhatsApp')
                      return
                    }
                    
                    try {
                      // Create PDF download link
                      const pdfLink = `${window.location.origin}/api/bill-pdf/${completedSale._id || completedSale.id}`
                      
                      const customMessage = settings.whatsappMessage || ''
                      const billMessage = `*${(settings.storeName || 'STORE').toUpperCase()}*

*Bill No:* ${completedSale.billNo}
*Customer:* ${completedSale.customerName}
*Date:* ${completedSale.date.toLocaleDateString('en-IN')}
*Time:* ${completedSale.date.toLocaleTimeString('en-IN', {hour12: true})}

*ITEMS PURCHASED:*
${completedSale.items.map((item: any) => `• ${item.name} x${item.quantity} = Rs${item.total.toFixed(2)}`).join('\n')}

*TOTAL AMOUNT: Rs${completedSale.total.toFixed(2)}*
*Payment Method:* ${completedSale.paymentMethod || 'Cash'}

*Download Your Bill:*
${pdfLink}

${customMessage ? `\n*Note:* ${customMessage}\n` : ''}
${settings.address || 'Store Address'}
Contact: ${settings.phone || '9427300816'}`

                      const whatsappUrl = `https://wa.me/${completedSale.customerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(billMessage)}`
                      window.open(whatsappUrl, '_blank')
                      showToast.success('WhatsApp message opened successfully!')
                    } catch (error) {
                      showToast.error('Failed to open WhatsApp')
                      console.error('WhatsApp error:', error)
                    }
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Send WhatsApp
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsBillModalOpen(false)
                    clearCart()
                  }}
                >
                  New Sale
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
