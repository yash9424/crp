"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CreditCard, X } from "lucide-react"

interface ExpiryData {
  expiringTenants: any[]
  expiredTenants: any[]
  totalTenants: number
}

export function PlanExpiryNotification() {
  const [expiryData, setExpiryData] = useState<ExpiryData | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    const checkExpiry = async () => {
      try {
        const response = await fetch('/api/tenant-expiry')
        if (response.ok) {
          const data = await response.json()
          setExpiryData(data)
          
          // Show notification if there are expiring or expired tenants
          if (data.expiringTenants.length > 0 || data.expiredTenants.length > 0) {
            setShowNotification(true)
          } else {
            setShowNotification(false)
          }
        }
      } catch (error) {
        console.error('Failed to check tenant expiry:', error)
        setShowNotification(false)
      }
    }

    checkExpiry()
    // Check every 5 minutes for real-time updates
    const interval = setInterval(checkExpiry, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleAutoDeactivate = async () => {
    try {
      const response = await fetch('/api/tenant-expiry', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        alert(`${result.deactivatedCount} tenants deactivated due to plan expiry`)
        // Refresh data
        const refreshResponse = await fetch('/api/tenant-expiry')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setExpiryData(data)
        }
      }
    } catch (error) {
      console.error('Failed to deactivate expired tenants:', error)
    }
  }

  if (!showNotification || !expiryData) return null

  return (
    <Card className="border-orange-200 bg-orange-50 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-800">Plan Expiry Alerts</CardTitle>
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
        {expiryData.expiredTenants.length > 0 && (
          <div className="space-y-2">
            {expiryData.expiredTenants.map((tenant: any) => (
              <div key={tenant._id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <span className="text-sm font-medium text-red-800 block">
                      {tenant.name || 'Store'} - Plan Expired
                    </span>
                    <span className="text-xs text-red-600">
                      {tenant.daysOverdue} days overdue
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleAutoDeactivate}
                >
                  Deactivate
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {expiryData.expiringTenants.length > 0 && (
          <div className="space-y-2">
            {expiryData.expiringTenants.map((tenant: any) => (
              <div key={tenant._id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <span className="text-sm font-medium text-yellow-800 block">
                      {tenant.name || 'Store'} - Plan Expiring Soon
                    </span>
                    <span className="text-xs text-yellow-600">
                      {tenant.daysLeft} days remaining
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  Renew Plan
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Last checked: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}