"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/toast"

export default function TestSetupPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)

  const initializeSystem = async () => {
    setLoading(true)
    try {
      // Initialize business types
      const btResponse = await fetch('/api/init-business-types', {
        method: 'POST'
      })
      const btData = await btResponse.json()
      
      // Set default business type for tenant
      const configResponse = await fetch('/api/tenant-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: 'fashion-retail',
          fields: [
            { name: 'Name', type: 'text', required: true, enabled: true },
            { name: 'SKU', type: 'text', required: true, enabled: true },
            { name: 'Barcode', type: 'barcode', required: false, enabled: true },
            { name: 'Category', type: 'select', required: true, enabled: true, options: ['Shirts', 'Pants', 'Dresses', 'Shoes', 'Accessories'] },
            { name: 'Brand', type: 'text', required: false, enabled: true },
            { name: 'Price', type: 'number', required: true, enabled: true },
            { name: 'Cost Price', type: 'number', required: true, enabled: true },
            { name: 'Stock', type: 'number', required: true, enabled: true },
            { name: 'Min Stock', type: 'number', required: false, enabled: true },
            { name: 'Sizes', type: 'text', required: false, enabled: true },
            { name: 'Colors', type: 'text', required: false, enabled: true },
            { name: 'Material', type: 'text', required: false, enabled: true },
            { name: 'Description', type: 'textarea', required: false, enabled: true }
          ]
        })
      })
      
      setStatus({
        businessTypes: btData,
        fieldsConfig: await configResponse.json()
      })
      
      showToast.success('System initialized successfully!')
    } catch (error) {
      showToast.error('Failed to initialize system')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    try {
      const [btResponse, fieldsResponse] = await Promise.all([
        fetch('/api/business-types'),
        fetch('/api/tenant-fields')
      ])
      
      const btData = await btResponse.json()
      const fieldsData = await fieldsResponse.json()
      
      setStatus({
        businessTypes: btData,
        tenantFields: fieldsData
      })
    } catch (error) {
      console.error('Failed to check status:', error)
    }
  }

  return (
    <MainLayout title="System Setup Test">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Setup & Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={initializeSystem} disabled={loading}>
                {loading ? 'Initializing...' : 'Initialize System'}
              </Button>
              <Button variant="outline" onClick={checkStatus}>
                Check Status
              </Button>
            </div>
            
            {status && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">System Status:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}