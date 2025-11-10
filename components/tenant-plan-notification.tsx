"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CreditCard, X } from "lucide-react"

interface PlanStatus {
  planName: string
  expiryDate: string
  daysLeft: number
  isExpired: boolean
  isExpiringSoon: boolean
}

export function TenantPlanNotification() {
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    const checkPlanStatus = async () => {
      try {
        const response = await fetch('/api/tenant-plan-status')
        if (response.ok) {
          const data = await response.json()
          setPlanStatus(data)
          setShowNotification(data.showNotification || false)
        } else {
          setShowNotification(false)
        }
      } catch (error) {
        console.error('Failed to check plan status:', error)
        setShowNotification(false)
      }
    }

    checkPlanStatus()
    const interval = setInterval(checkPlanStatus, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!showNotification || !planStatus) return null

  return (
    <Card className={`mb-6 ${planStatus.isExpired ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${planStatus.isExpired ? 'text-red-600' : 'text-orange-600'}`} />
            <CardTitle className={`text-lg ${planStatus.isExpired ? 'text-red-800' : 'text-orange-800'}`}>
              {planStatus.isExpired ? 'Plan Expired' : 'Plan Expiring Soon'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotification(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {planStatus.isExpired ? (
          <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-red-800">Your {planStatus.planName} plan has expired!</div>
                <div className="text-sm text-red-600 mt-1">
                  Expired on: {new Date(planStatus.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                </div>
                <div className="text-sm text-red-600">
                  Your account will be deactivated soon. Please renew to continue using the service.
                </div>
              </div>
              <Badge variant="destructive">Expired</Badge>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-orange-100 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-orange-800">Your {planStatus.planName} plan expires soon!</div>
                <div className="text-sm text-orange-600 mt-1">
                  Expires on: {new Date(planStatus.expiryDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                </div>
                <div className="text-sm text-orange-600">
                  Only {planStatus.daysLeft} days left. Renew now to avoid service interruption.
                </div>
              </div>
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                {planStatus.daysLeft} days left
              </Badge>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <CreditCard className="w-4 h-4 mr-2" />
            Renew Plan
          </Button>
          <Button variant="outline">
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}