"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Eye } from "lucide-react"

export default function DatabaseViewerPage() {
  const [tenantFields, setTenantFields] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fieldsRes, productsRes] = await Promise.all([
        fetch('/api/tenant-fields'),
        fetch('/api/inventory')
      ])
      
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json()
        setTenantFields(fieldsData)
      }
      
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <MainLayout title="Database Viewer">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <Database className="w-6 h-6 mr-2" />
            Database Structure Viewer
          </h1>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Field Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Field Configuration (tenant_fields collection)</CardTitle>
          </CardHeader>
          <CardContent>
            {tenantFields ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Tenant ID:</strong> {tenantFields.tenantId || 'Not set'}
                  </div>
                  <div>
                    <strong>Business Type:</strong> {tenantFields.businessType || 'Not set'}
                  </div>
                </div>
                
                <div>
                  <strong>Configured Fields ({tenantFields.fields?.length || 0}):</strong>
                  <div className="mt-2 space-y-2">
                    {tenantFields.fields?.map((field: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                        <Badge variant={field.enabled ? "default" : "secondary"}>
                          {field.name}
                        </Badge>
                        <span className="text-sm text-gray-600">{field.type}</span>
                        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        {field.options && (
                          <span className="text-xs text-gray-500">
                            Options: {field.options.join(', ')}
                          </span>
                        )}
                      </div>
                    )) || <p className="text-gray-500">No fields configured</p>}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <strong>Raw JSON:</strong>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(tenantFields, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No field configuration found</p>
            )}
          </CardContent>
        </Card>

        {/* Products Data */}
        <Card>
          <CardHeader>
            <CardTitle>Products Data (products_tenantId collection)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span><strong>Total Products:</strong> {products.length}</span>
                <Badge variant="outline">{products.length} items</Badge>
              </div>

              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.slice(0, 3).map((product, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{product.name || 'Unnamed Product'}</h4>
                        <Badge>{product.sku}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(product).map(([key, value]) => {
                          if (key === '_id' || key === 'id') return null
                          return (
                            <div key={key} className="flex">
                              <span className="font-medium w-24">{key}:</span>
                              <span className="text-gray-600">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Raw JSON
                        </summary>
                        <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(product, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                  
                  {products.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {products.length - 3} more products
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No products found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}