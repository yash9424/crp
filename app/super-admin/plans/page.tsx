"use client"

import { useState, useEffect } from "react"
import { AVAILABLE_FEATURES, FEATURE_CATEGORIES, DEFAULT_FEATURE_SETS, FeatureKey } from "@/lib/feature-permissions"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  CreditCard,
  Users,
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Check,
  Filter,
  Settings,
  X,
} from "lucide-react"

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  maxUsers: number
  maxProducts: number
  description: string
  status: string
  subscribers?: number
  createdAt: string
  allowedFeatures?: string[]
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    maxProducts: '',
    features: '',
    description: '',
    allowedFeatures: [] as string[]
  })

  // Fetch plans from API
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create new plan
  const createPlan = async () => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxUsers: 999999, // Unlimited users
          features: formData.features.split(',').map(f => f.trim()),
          allowedFeatures: formData.allowedFeatures
        })
      })
      if (response.ok) {
        fetchPlans()
        setIsAddPlanOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create plan:', error)
    }
  }

  // Update plan
  const updatePlan = async () => {
    if (!selectedPlan) return
    try {
      const response = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxUsers: 999999, // Unlimited users
          features: formData.features.split(',').map(f => f.trim()),
          allowedFeatures: formData.allowedFeatures
        })
      })
      if (response.ok) {
        fetchPlans()
        setIsEditPlanOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to update plan:', error)
    }
  }

  // Delete plan
  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      const response = await fetch(`/api/plans/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }

  // Toggle plan status
  const togglePlanStatus = async (plan: Plan) => {
    const newStatus = plan.status.toLowerCase() === 'active' ? 'inactive' : 'active'
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          status: newStatus
        })
      })
      if (response.ok) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to toggle plan status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      maxProducts: '',
      features: '',
      description: '',
      allowedFeatures: []
    })
    setSelectedPlan(null)
  }

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      maxProducts: plan.maxProducts.toString(),
      features: plan.features.join(', '),
      description: plan.description,
      allowedFeatures: plan.allowedFeatures || []
    })
    setIsEditPlanOpen(true)
  }

  const handleFeatureToggle = (featureKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowedFeatures: checked
        ? [...prev.allowedFeatures, featureKey]
        : prev.allowedFeatures.filter(f => f !== featureKey)
    }))
  }

  const applyFeatureTemplate = (template: keyof typeof DEFAULT_FEATURE_SETS) => {
    setFormData(prev => ({
      ...prev,
      allowedFeatures: [...DEFAULT_FEATURE_SETS[template]]
    }))
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || plan.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading plans...</div>
      </div>
    )
  }

  const totalPlans = plans.length
  const activePlans = plans.filter((p) => p.status.toLowerCase() === "active").length
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.subscribers || 0), 0)
  const avgPrice = plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.price, 0) / plans.length) : 0

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Active Plans</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Inactive Plans</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans - activePlans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Avg Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {avgPrice}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage pricing plans for clothing store tenants</CardDescription>
            </div>
            <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Plan</DialogTitle>
                  <DialogDescription>Create a new subscription plan</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="planName">Plan Name</Label>
                      <Input
                        id="planName"
                        placeholder="Basic Plan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planPrice">Price (₹ /year)</Label>
                      <Input
                        id="planPrice"
                        type="number"
                        placeholder="999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxProducts">Max Products</Label>
                    <Input
                      id="maxProducts"
                      type="number"
                      placeholder="1000"
                      value={formData.maxProducts}
                      onChange={(e) => setFormData({ ...formData, maxProducts: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Plan description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Feature Access Control */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Feature Access Control</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => applyFeatureTemplate('basic')}>Basic</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyFeatureTemplate('standard')}>Standard</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyFeatureTemplate('premium')}>Premium</Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {FEATURE_CATEGORIES.map(category => {
                        const categoryFeatures = Object.entries(AVAILABLE_FEATURES)
                          .filter(([_, feature]) => feature.category === category)

                        if (categoryFeatures.length === 0) return null

                        return (
                          <div key={category} className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">{category}</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {categoryFeatures.map(([key, feature]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`feature-${key}`}
                                    checked={formData.allowedFeatures.includes(key)}
                                    onCheckedChange={(checked) => handleFeatureToggle(key, checked as boolean)}
                                    disabled={(feature as any).required || false}
                                  />
                                  <Label htmlFor={`feature-${key}`} className="text-sm">
                                    {feature.name}
                                    {(feature as any).required && <span className="text-xs text-muted-foreground ml-1">(Required)</span>}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddPlanOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={createPlan}>
                    Create Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Plan Dialog */}
            <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Plan</DialogTitle>
                  <DialogDescription>Update the subscription plan details</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editPlanName">Plan Name</Label>
                      <Input
                        id="editPlanName"
                        placeholder="Basic Plan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editPlanPrice">Price (₹ /year)</Label>
                      <Input
                        id="editPlanPrice"
                        type="number"
                        placeholder="999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMaxProducts">Max Products</Label>
                    <Input
                      id="editMaxProducts"
                      type="number"
                      placeholder="1000"
                      value={formData.maxProducts}
                      onChange={(e) => setFormData({ ...formData, maxProducts: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      placeholder="Plan description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Feature Access Control */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Feature Access Control</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => applyFeatureTemplate('basic')}>Basic</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyFeatureTemplate('standard')}>Standard</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyFeatureTemplate('premium')}>Premium</Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {FEATURE_CATEGORIES.map(category => {
                        const categoryFeatures = Object.entries(AVAILABLE_FEATURES)
                          .filter(([_, feature]) => feature.category === category)

                        if (categoryFeatures.length === 0) return null

                        return (
                          <div key={category} className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">{category}</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {categoryFeatures.map(([key, feature]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-feature-${key}`}
                                    checked={formData.allowedFeatures.includes(key)}
                                    onCheckedChange={(checked) => handleFeatureToggle(key, checked as boolean)}
                                    disabled={(feature as any).required || false}
                                  />
                                  <Label htmlFor={`edit-feature-${key}`} className="text-sm">
                                    {feature.name}
                                    {(feature as any).required && <span className="text-xs text-muted-foreground ml-1">(Required)</span>}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditPlanOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={updatePlan}>
                    Update Plan
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
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Plan Details</TableHead>
                  <TableHead className="text-center">Pricing</TableHead>
                  <TableHead className="text-center">Limits</TableHead>
                  <TableHead className="text-center">Features</TableHead>
                  <TableHead className="text-center">Subscribers</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="text-center">
                      <div>
                        <div className="font-medium">{plan.name} Plan</div>
                        <div className="text-sm text-muted-foreground">ID: {plan.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div>
                        <div className="font-bold text-lg">₹ {plan.price}</div>
                        <div className="text-xs text-muted-foreground">per year</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <div>{plan.maxProducts} products</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {(plan.allowedFeatures || []).slice(0, 3).map((featureKey, index) => {
                          const feature = AVAILABLE_FEATURES[featureKey as FeatureKey]
                          return (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature?.name || featureKey}
                            </Badge>
                          )
                        })}
                        {(plan.allowedFeatures || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(plan.allowedFeatures || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-medium">{plan.subscribers}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => togglePlanStatus(plan)}
                          className="cursor-pointer"
                        >
                          {getStatusBadge(plan.status)}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deletePlan(plan.id)}
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
  )
}