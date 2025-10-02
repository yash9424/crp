"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFeatureAccess } from "@/hooks/use-feature-access"
import { AVAILABLE_FEATURES, FEATURE_CATEGORIES } from "@/lib/feature-permissions"
import { Check, X, Lock } from "lucide-react"

export default function FeatureStatusPage() {
  const { allowedFeatures, hasFeature, loading } = useFeatureAccess()

  if (loading) {
    return (
      <MainLayout title="Feature Status" userRole="tenant-admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading feature status...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Feature Status" userRole="tenant-admin">
      <div className="space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Plan Features</CardTitle>
            <CardDescription>
              Features available in your current subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">{allowedFeatures.length}</div>
              <div className="text-muted-foreground">features enabled</div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Categories */}
        {FEATURE_CATEGORIES.map(category => {
          const categoryFeatures = Object.entries(AVAILABLE_FEATURES)
            .filter(([_, feature]) => feature.category === category)
          
          if (categoryFeatures.length === 0) return null

          const enabledCount = categoryFeatures.filter(([key]) => hasFeature(key as any)).length

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <Badge variant="outline">
                    {enabledCount}/{categoryFeatures.length} enabled
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {categoryFeatures.map(([featureKey, feature]) => {
                    const isEnabled = hasFeature(featureKey as any)
                    
                    return (
                      <div key={featureKey} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded-full ${isEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isEnabled ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            {feature.required && (
                              <Badge variant="outline" className="text-xs mt-1">Required</Badge>
                            )}
                          </div>
                        </div>
                        {!isEnabled && (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Upgrade Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Need More Features?</CardTitle>
            <CardDescription className="text-orange-700">
              Contact your administrator to upgrade your plan and unlock additional features.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </MainLayout>
  )
}