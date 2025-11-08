"use client"

import { useState, useEffect } from "react"
//import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { AVAILABLE_FEATURES, FEATURE_CATEGORIES, FeatureKey } from "@/lib/feature-permissions"
import { Check, X, Settings, Save } from "lucide-react"
import { showToast } from "@/lib/toast"

interface Plan {
  id: string
  name: string
  price: number
  allowedFeatures: string[]
  maxUsers: number
  maxProducts: number
  status: string
}

export default function FeatureMatrixPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [changes, setChanges] = useState<{ [planId: string]: string[] }>({})

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

  const toggleFeature = (planId: string, feature: FeatureKey) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    const currentFeatures = changes[planId] || plan.allowedFeatures || []
    const hasFeature = currentFeatures.includes(feature)

    const newFeatures = hasFeature
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature]

    setChanges(prev => ({
      ...prev,
      [planId]: newFeatures
    }))
  }

  const saveChanges = async () => {
    try {
      for (const [planId, features] of Object.entries(changes)) {
        await fetch(`/api/plans/${planId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allowedFeatures: features })
        })
      }

      showToast.success('Feature permissions updated successfully!')
      setChanges({})
      setEditMode(false)
      fetchPlans()
    } catch (error) {
      showToast.error('Failed to update feature permissions')
    }
  }

  const hasFeature = (planId: string, feature: FeatureKey): boolean => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return false

    const features = changes[planId] || plan.allowedFeatures || []
    return features.includes(feature)
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading feature matrix...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Access Matrix</CardTitle>
              <CardDescription>
                View and customize which features are available in each plan
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setEditMode(false)
                    setChanges({})
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={saveChanges}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Features
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Plans Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                  {plan.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                ₹{plan.price}/year • {plan.maxUsers} users • {plan.maxProducts} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {(changes[plan.id] || plan.allowedFeatures || []).length} features enabled
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison Matrix</CardTitle>
          <CardDescription>
            {editMode ? 'Click checkboxes to modify feature access' : 'View feature availability across plans'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 sticky left-0 bg-background z-10 border-r">Feature</TableHead>
                  <TableHead className="text-center w-24 sticky left-48 bg-background z-10 border-r">Category</TableHead>
                  {plans.map((plan) => (
                    <TableHead key={plan.id} className="text-center min-w-32">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">₹{plan.price}/year</div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {FEATURE_CATEGORIES.map(category => {
                  const categoryFeatures = Object.entries(AVAILABLE_FEATURES)
                    .filter(([_, feature]) => feature.category === category)

                  return categoryFeatures.map(([featureKey, feature], index) => (
                    <TableRow key={featureKey}>
                      <TableCell className="sticky left-0 bg-background z-10 border-r">
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          {(feature as any).required && (
                            <Badge variant="outline" className="text-xs mt-1">Required</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center sticky left-48 bg-background z-10 border-r">
                        <Badge variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      </TableCell>
                      {plans.map((plan) => (
                        <TableCell key={plan.id} className="text-center">
                          {editMode && !(feature as any).required ? (
                            <Checkbox
                              checked={hasFeature(plan.id, featureKey as FeatureKey)}
                              onCheckedChange={() => toggleFeature(plan.id, featureKey as FeatureKey)}
                            />
                          ) : (
                            <div className="flex justify-center">
                              {hasFeature(plan.id, featureKey as FeatureKey) ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <X className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Feature Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {FEATURE_CATEGORIES.map(category => {
                const count = Object.values(AVAILABLE_FEATURES)
                  .filter(f => f.category === category).length
                return (
                  <div key={category} className="flex justify-between">
                    <span>{category}</span>
                    <Badge variant="outline">{count} features</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plans.map(plan => (
                <div key={plan.id} className="flex justify-between">
                  <span>{plan.name}</span>
                  <Badge variant="outline">
                    {(changes[plan.id] || plan.allowedFeatures || []).length} features
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}