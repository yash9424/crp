"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFeatureAccess } from "@/hooks/use-feature-access"

export default function DebugFeaturesPage() {
  const { data: session } = useSession()
  const { allowedFeatures, hasFeature, loading } = useFeatureAccess()
  const [apiResponse, setApiResponse] = useState<any>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('/api/tenant-features')
        const data = await response.json()
        setApiResponse({ status: response.status, data })
      } catch (error) {
        setApiResponse({ error: error.message })
      }
    }
    testAPI()
  }, [])

  return (
    <MainLayout title="Debug Features" userRole="tenant-admin">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Access Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading.toString()}</p>
              <p><strong>Allowed Features:</strong> {JSON.stringify(allowedFeatures)}</p>
              <p><strong>Has Inventory:</strong> {hasFeature('inventory').toString()}</p>
              <p><strong>Has POS:</strong> {hasFeature('pos').toString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Response Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}