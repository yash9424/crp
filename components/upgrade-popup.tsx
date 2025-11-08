"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Zap, Star, ArrowRight, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface PlanLimits {
  maxProducts: number
  maxUsers: number
  currentProducts: number
  currentUsers: number
  planName: string
}

interface Plan {
  id: string
  name: string
  price: number
  maxProducts: number
  maxUsers: number
  description: string
}

interface UpgradePopupProps {
  isOpen: boolean
  onClose: () => void
  limits: PlanLimits
  type: 'product' | 'user'
}

export function UpgradePopup({ isOpen, onClose, limits, type }: UpgradePopupProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        // Filter plans that have higher limits than current
        const upgradePlans = data.filter((plan: Plan) => {
          if (type === 'product') {
            return plan.maxProducts > limits.maxProducts
          } else {
            return plan.maxUsers > limits.maxUsers
          }
        })
        setPlans(upgradePlans)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPlanUpgrade = async (planId: string) => {
    try {
      const response = await fetch('/api/plan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          reason: `${type === 'product' ? 'Product' : 'User'} limit exceeded - need upgrade` 
        })
      })
      
      if (response.ok) {
        alert('✅ Upgrade request submitted! Admin will review shortly.')
        onClose()
      } else {
        alert('❌ Failed to submit request')
      }
    } catch (error) {
      alert('❌ Error submitting request')
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Zap className="w-5 h-5" />
      case 'standard': return <Star className="w-5 h-5" />
      case 'premium': return <Crown className="w-5 h-5" />
      default: return <Zap className="w-5 h-5" />
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl">
              {type === 'product' ? 'Product' : 'User'} Limit Reached!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Your <Badge variant="outline">{limits.planName}</Badge> plan allows{' '}
              {type === 'product' ? limits.maxProducts : limits.maxUsers}{' '}
              {type === 'product' ? 'products' : 'users'}. 
              You currently have{' '}
              {type === 'product' ? limits.currentProducts : limits.currentUsers}.
              Upgrade to continue adding more.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading upgrade options...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No upgrade options available.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/tenant/upgrade-plan')}
              >
                View All Plans
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Choose Your Upgrade</h3>
                <p className="text-sm text-muted-foreground">
                  Select a plan with higher {type === 'product' ? 'product' : 'user'} limits
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`relative ${getPlanColor(plan.name)}`}>
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-2 p-2 rounded-full bg-white shadow-sm w-fit">
                        {getPlanIcon(plan.name)}
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold">₹{plan.price}</div>
                      <CardDescription>per month</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Products:</span>
                          <span className="font-medium">{plan.maxProducts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Users:</span>
                          <span className="font-medium">{plan.maxUsers}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          onClick={() => {
                            onClose()
                            router.push('/tenant/upgrade-plan')
                          }}
                          className="w-full"
                          size="sm"
                        >
                          Upgrade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onClose()
                    router.push('/tenant/upgrade-plan')
                  }}
                >
                  View All Plans & Features
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}