"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Crown, Zap, Star } from "lucide-react"
import { AVAILABLE_FEATURES, FEATURE_CATEGORIES } from "@/lib/feature-permissions"
import { showToast } from "@/lib/toast"

interface Plan {
  id: string
  name: string
  price: number
  allowedFeatures: string[]
  maxUsers: number
  maxProducts: number
  description: string
}

export default function UpgradePlanPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/tenant-features')
      if (response.ok) {
        const data = await response.json()
        
        // Find current plan based on allowed features
        const current = plans.find(plan => {
          const planFeatures = plan.allowedFeatures || []
          const tenantFeatures = data.allowedFeatures || []
          return planFeatures.length === tenantFeatures.length && 
                 planFeatures.every((f: string) => tenantFeatures.includes(f))
        })
        
        setCurrentPlan(current || {
          id: 'unknown',
          name: 'Current Plan',
          price: 0,
          allowedFeatures: data.allowedFeatures || [],
          maxUsers: 1,
          maxProducts: 100,
          description: 'Your current subscription'
        })
      }
    } catch (error) {
      console.error('Failed to fetch current plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPlanUpgrade = async (planId: string) => {
    try {
      const response = await fetch('/api/plan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, reason: 'Plan upgrade request' })
      })
      
      if (response.ok) {
        showToast.success('Plan upgrade request submitted! Admin will review shortly.')
      } else {
        showToast.error('Failed to submit request')
      }
    } catch (error) {
      showToast.error('Error submitting request')
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (plans.length > 0) {
      fetchCurrentPlan()
    }
  }, [plans])

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Zap className="w-6 h-6" />
      case 'standard': return <Star className="w-6 h-6" />
      case 'premium': return <Crown className="w-6 h-6" />
      default: return <Zap className="w-6 h-6" />
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'border-blue-200 bg-blue-50'
      case 'standard': return 'border-green-200 bg-green-50'
      case 'premium': return 'border-purple-200 bg-purple-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <MainLayout title="Upgrade Plan" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading plans...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Upgrade Plan" userRole="tenant-admin">
      <div className="space-y-8">
        {/* Current Plan */}
        {currentPlan && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPlanIcon(currentPlan.name)}
                  <div>
                    <CardTitle>Current Plan: {currentPlan.name}</CardTitle>
                    <CardDescription>₹{currentPlan.price}/year</CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {currentPlan.allowedFeatures?.length || 0} features • {currentPlan.maxUsers} users • {currentPlan.maxProducts} products
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id
            
            return (
              <Card key={plan.id} className={`relative ${getPlanColor(plan.name)} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-white shadow-sm">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">₹{plan.price}</div>
                  <CardDescription>per year</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    {plan.allowedFeatures?.length || 0} features • {plan.maxUsers} users • {plan.maxProducts} products
                  </div>
                  
                  {/* Feature List */}
                  <div className="space-y-2">
                    {FEATURE_CATEGORIES.map(category => {
                      const categoryFeatures = Object.entries(AVAILABLE_FEATURES)
                        .filter(([_, feature]) => feature.category === category)
                      
                      return categoryFeatures.map(([featureKey, feature]) => {
                        const hasFeature = plan.allowedFeatures?.includes(featureKey)
                        
                        return (
                          <div key={featureKey} className="flex items-center gap-2 text-sm">
                            {hasFeature ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                            <span className={hasFeature ? 'text-foreground' : 'text-muted-foreground'}>
                              {feature.name}
                            </span>
                          </div>
                        )
                      })
                    }).flat().slice(0, 8)}
                    
                    {Object.keys(AVAILABLE_FEATURES).length > 8 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{Object.keys(AVAILABLE_FEATURES).length - 8} more features
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => requestPlanUpgrade(plan.id)}
                        className="w-full"
                        variant={plan.name.toLowerCase() === 'premium' ? 'default' : 'outline'}
                      >
                        Request {currentPlan && plan.price > currentPlan.price ? 'Upgrade' : 'Plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help Choosing?</CardTitle>
            <CardDescription>
              Contact our support team to help you select the right plan for your business needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}