"use client"

import { useState, useEffect } from "react"
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
  Building2,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Ban,
  CheckCircle,
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface Tenant {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  plan: string
  planName?: string
  tenantType?: string
  status: string
  createdAt: string
  referralCode?: string
  users: Array<{
    id: string
    name: string
    email: string
  }>
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [referralStats, setReferralStats] = useState({ total: 0, completed: 0, totalRewards: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    plan: "",
    tenantType: "retail",
    businessType: "none",
    referralCode: "",
    customReward: ""
  })
  const [referralValidation, setReferralValidation] = useState({ valid: false, message: "", referrer: "" })
  const [availableReferralCodes, setAvailableReferralCodes] = useState<Array<{ code: string, name: string }>>([])
  const [plans, setPlans] = useState<Array<{ id?: string, _id?: string, name: string, price: number, status?: string }>>([])
  const [businessTypes, setBusinessTypes] = useState<Array<{ id: string, name: string, description: string }>>([])

  // Fetch tenants from API
  const fetchTenants = async () => {
    try {
      const [tenantsResponse, plansResponse, businessTypesResponse] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/plans'),
        fetch('/api/business-types')
      ])

      if (tenantsResponse.ok && plansResponse.ok && businessTypesResponse.ok) {
        const tenantsData = await tenantsResponse.json()
        const plansData = await plansResponse.json()
        const businessTypesData = await businessTypesResponse.json()

        // Map plan IDs to plan names (handle both _id and id formats)
        const planMap = plansData.reduce((acc: any, plan: any) => {
          const planId = plan._id || plan.id
          acc[planId] = plan.name
          // Also map by string version of ObjectId
          if (plan._id) {
            acc[plan._id.toString()] = plan.name
          }
          return acc
        }, {})

        const tenantsWithPlanNames = tenantsData.map((tenant: any) => {
          let planName = 'Unknown Plan'
          if (tenant.plan) {
            // Try direct lookup first
            planName = planMap[tenant.plan] || planMap[tenant.plan.toString()] || 'Unknown Plan'
          }
          return {
            ...tenant,
            planName
          }
        })

        setTenants(tenantsWithPlanNames)
        // Filter only active plans for dropdown
        setPlans(plansData.filter((plan: any) => plan.status === 'active'))
        setBusinessTypes(businessTypesData)
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create new tenant
  const createTenant = async () => {
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        fetchTenants()
        fetchReferralStats() // Refresh referral stats
        setIsAddTenantOpen(false)
        setFormData({ name: "", email: "", password: "", phone: "", address: "", plan: "", tenantType: "retail", businessType: "none", referralCode: "", customReward: "" })

        // Show success message
        if (formData.referralCode) {
          showToast.success(`Tenant created successfully! Referral reward has been processed for code: ${formData.referralCode}`)
        } else {
          showToast.success('Tenant created successfully!')
        }
      } else {
        const error = await response.json()
        showToast.error(error.error || 'Failed to create tenant')
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
      showToast.error('Network error - please try again')
    }
  }

  // Update tenant
  const updateTenant = async () => {
    if (!editingTenant) return

    try {
      const response = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchTenants()
        setIsEditTenantOpen(false)
        setEditingTenant(null)
        setFormData({ name: "", email: "", password: "", phone: "", address: "", plan: "", tenantType: "retail", businessType: "none", referralCode: "", customReward: "" })
        showToast.success('Tenant updated successfully!')
      } else {
        const error = await response.json()
        showToast.error(error.error || 'Failed to update tenant')
      }
    } catch (error) {
      console.error('Failed to update tenant:', error)
    }
  }

  // Open edit modal
  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      email: tenant.email,
      password: "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      plan: tenant.plan,
      tenantType: (tenant as any).tenantType || "retail",
      businessType: (tenant as any).businessType || "none",
      referralCode: "",
      customReward: ""
    })
    setIsEditTenantOpen(true)
  }

  // Toggle tenant status
  const toggleTenantStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? 'activate' : 'deactivate'

    if (window.confirm(`Are you sure you want to ${action} this tenant?`)) {
      try {
        const response = await fetch(`/api/tenants/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })

        if (response.ok) {
          fetchTenants()
          showToast.success(`Tenant ${action}d successfully!`)
        } else {
          showToast.error(`Failed to ${action} tenant`)
        }
      } catch (error) {
        console.error(`Failed to ${action} tenant:`, error)
        showToast.error(`Error ${action}ing tenant`)
      }
    }
  }

  // Delete tenant
  const deleteTenant = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchTenants()
          showToast.success('Tenant deleted successfully!')
        } else {
          showToast.error('Failed to delete tenant')
        }
      } catch (error) {
        console.error('Failed to delete tenant:', error)
        showToast.error('Error deleting tenant')
      }
    }
  }

  useEffect(() => {
    fetchTenants()
    fetchReferralStats()
    fetchAvailableReferralCodes()
  }, [])



  // Fetch available referral codes
  const fetchAvailableReferralCodes = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const tenants = await response.json()
        const codes = tenants.map((t: any) => ({
          code: t.referralCode,
          name: t.name
        })).filter((c: any) => c.code)
        setAvailableReferralCodes(codes)
      }
    } catch (error) {
      console.error('Failed to fetch referral codes:', error)
    }
  }

  // Fetch referral statistics
  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/super-admin/referrals')
      if (response.ok) {
        const referrals = await response.json()
        const stats = {
          total: referrals.length,
          completed: referrals.filter((r: any) => r.status === 'Completed').length,
          totalRewards: referrals.reduce((sum: number, r: any) => sum + (r.reward || 0), 0)
        }
        setReferralStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error)
    }
  }

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 6) {
      setReferralValidation({ valid: false, message: "", referrer: "" })
      return
    }

    try {
      const response = await fetch(`/api/referral-codes?code=${code}`)
      const result = await response.json()
      setReferralValidation({
        valid: result.valid,
        message: result.message,
        referrer: result.referrer || ""
      })
    } catch (error) {
      setReferralValidation({
        valid: false,
        message: "Error validating code",
        referrer: ""
      })
    }
  }

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = (tenant.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = planFilter === "all" || (tenant.planName || '').toLowerCase() === planFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter
    return matchesSearch && matchesPlan && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanBadge = (planName: string) => {
    const name = planName?.toLowerCase() || 'unknown'
    switch (name) {
      case "basic":
        return <Badge variant="outline">Basic</Badge>
      case "standard":
        return <Badge className="bg-blue-500">Standard</Badge>
      case "premium":
        return <Badge className="bg-purple-500">Premium</Badge>
      default:
        return <Badge variant="outline">{planName || 'Unknown'}</Badge>
    }
  }

  const getTenantTypeBadge = (tenantType: string) => {
    switch (tenantType) {
      case "retail":
        return <Badge className="bg-green-500">Retail</Badge>
      case "manufacturer":
        return <Badge className="bg-orange-500">Manufacturer</Badge>
      case "distributor":
        return <Badge className="bg-blue-500">Distributor</Badge>
      default:
        return <Badge variant="outline">Retail</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tenants...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Pro Plans</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.plan === 'pro').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.users.length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Total Referrals</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Referral Rewards</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{referralStats.totalRewards}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clothing Store Tenants</CardTitle>
                <CardDescription>Manage all clothing store tenants and their subscriptions</CardDescription>
              </div>
              <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setFormData({ name: "", email: "", password: "", phone: "", address: "", plan: "", tenantType: "retail", businessType: "", referralCode: "", customReward: "" })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Tenant</DialogTitle>
                    <DialogDescription>Create a new clothing store tenant</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenantName">Store Name</Label>
                      <Input
                        id="tenantName"
                        placeholder="Fashion Store Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantEmail">Email</Label>
                      <Input
                        id="tenantEmail"
                        type="email"
                        placeholder="store@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantPassword">Password</Label>
                      <Input
                        id="tenantPassword"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantPhone">Phone</Label>
                      <Input
                        id="tenantPhone"
                        placeholder="+1-555-0123"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type Template</Label>
                      <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Template</SelectItem>
                          {businessTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.businessType && formData.businessType !== 'none' && (
                        <div className="text-xs text-muted-foreground">
                          {businessTypes.find(t => t.id === formData.businessType)?.description}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantPlan">Plan</Label>
                      <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan._id || plan.id} value={plan._id || plan.id || ''}>
                              {plan.name} - ₹{plan.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantAddress">Address</Label>
                      <Textarea
                        id="tenantAddress"
                        placeholder="Store address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="referralCode"
                          placeholder="Enter referral code if any"
                          value={formData.referralCode}
                          onChange={(e) => {
                            const code = e.target.value.toUpperCase()
                            setFormData({ ...formData, referralCode: code })
                            if (code.length >= 6) {
                              validateReferralCode(code)
                            } else {
                              setReferralValidation({ valid: false, message: "", referrer: "" })
                            }
                          }}
                        />
                        <Select value="" onValueChange={(value) => {
                          setFormData({ ...formData, referralCode: value })
                          validateReferralCode(value)
                        }}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableReferralCodes.map((ref) => (
                              <SelectItem key={ref.code} value={ref.code}>
                                {ref.name} ({ref.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {referralValidation.message && (
                        <div className={`text-sm ${referralValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {referralValidation.message}
                        </div>
                      )}
                      {formData.referralCode && (
                        <div className="space-y-2 mt-2">
                          <Label htmlFor="customReward">Custom Reward Amount (Optional)</Label>
                          <Input
                            id="customReward"
                            type="number"
                            placeholder="Enter custom reward amount"
                            value={formData.customReward}
                            onChange={(e) => setFormData({ ...formData, customReward: e.target.value })}
                          />
                          <div className="text-xs text-muted-foreground">
                            Leave empty for default: Basic=₹199, Pro=₹299, Enterprise=₹499
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddTenantOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTenant}>
                      Create Tenant
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Tenant Dialog */}
              <Dialog open={isEditTenantOpen} onOpenChange={setIsEditTenantOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Tenant</DialogTitle>
                    <DialogDescription>Update tenant information</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editTenantName">Store Name</Label>
                      <Input
                        id="editTenantName"
                        placeholder="Fashion Store Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTenantEmail">Email</Label>
                      <Input
                        id="editTenantEmail"
                        type="email"
                        placeholder="store@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTenantPassword">New Password (leave blank to keep current)</Label>
                      <Input
                        id="editTenantPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTenantPhone">Phone</Label>
                      <Input
                        id="editTenantPhone"
                        placeholder="+1-555-0123"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editBusinessType">Business Type Template</Label>
                      <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Template</SelectItem>
                          {businessTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.businessType && formData.businessType !== 'none' && (
                        <div className="text-xs text-muted-foreground">
                          {businessTypes.find(t => t.id === formData.businessType)?.description}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTenantPlan">Plan</Label>
                      <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan._id || plan.id} value={plan._id || plan.id || ''}>
                              {plan.name} - ₹{plan.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTenantAddress">Address</Label>
                      <Textarea
                        id="editTenantAddress"
                        placeholder="Store address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditTenantOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateTenant}>
                      Update Tenant
                    </Button>
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
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id || plan.id} value={plan.name.toLowerCase()}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Store</TableHead>
                    <TableHead className="text-center">Contact</TableHead>
                    <TableHead className="text-center">Business Type</TableHead>
                    <TableHead className="text-center">Plan</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Referral Code</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Created</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {tenant.id.slice(0, 8)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="text-sm flex items-center justify-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {tenant.email}
                          </div>
                          {tenant.phone && (
                            <div className="text-xs text-muted-foreground flex items-center justify-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {tenant.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {(tenant as any).businessType && (tenant as any).businessType !== 'none'
                            ? businessTypes.find(bt => bt.id === (tenant as any).businessType)?.name || 'None'
                            : 'None'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPlanBadge(tenant.planName || 'Unknown')}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(tenant.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono text-xs">
                          {tenant.referralCode || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm font-medium">{tenant.users.length}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(tenant)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={tenant.status === 'active' ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'}
                            onClick={() => toggleTenantStatus(tenant.id, tenant.status)}
                            title={tenant.status === 'active' ? 'Deactivate tenant' : 'Activate tenant'}
                          >
                            {tenant.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteTenant(tenant.id)}
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
      </div>
    </div>
  )
}