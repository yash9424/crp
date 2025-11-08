"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MessageCircle, Phone, Bell } from "lucide-react"
import { showToast } from "@/lib/toast"

export function LowStockAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  const checkLowStock = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alerts/low-stock')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.lowStockProducts || [])
        if (data.lowStockProducts?.length > 0) {
          showToast.warning(`⚠️ ${data.lowStockProducts.length} low stock items found!`)
        } else {
          showToast.success('✅ All inventory levels are healthy')
        }
      }
    } catch (error) {
      showToast.error('❌ Failed to check stock levels')
    } finally {
      setLoading(false)
    }
  }

  const sendAlert = async () => {
    try {
      const response = await fetch('/api/alerts/low-stock', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank')
          showToast.success('📱 WhatsApp alert opened!')
        }
      } else {
        const error = await response.json()
        showToast.error(error.error || '❌ Failed to send alert')
      }
    } catch (error) {
      showToast.error('❌ Failed to send alert')
    }
  }

  useEffect(() => {
    checkLowStock()
    // Auto-check every 30 minutes
    const interval = setInterval(checkLowStock, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-orange-500" />
          <span>Low Stock Alerts</span>
          <Badge variant="outline">{alerts.length} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={checkLowStock} disabled={loading} className="w-full">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {loading ? 'Checking...' : 'Check Stock Levels'}
          </Button>
          
          {alerts.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Low Stock Items</div>
                  <Badge variant="destructive">{alerts.length} items</Badge>
                </div>
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {alerts.map((item: any) => (
                    <div key={item._id || item.id} className="text-sm">
                      • {item.name}: {item.stock} left (Min: {item.minStock || 10})
                    </div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  onClick={sendAlert}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send WhatsApp Alert
                </Button>
              </div>
            </div>
          )}
          
          {alerts.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All inventory levels are healthy!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}