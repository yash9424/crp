"use client"

import { useFeatureAccess } from '@/hooks/use-feature-access'
import { FeatureKey } from '@/lib/feature-permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

interface FeatureGuardProps {
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { hasFeature, loading } = useFeatureAccess()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!hasFeature(feature)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>Feature Not Available</CardTitle>
            <CardDescription>
              This feature is not included in your current plan. Please upgrade your plan to access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Contact your administrator to upgrade your plan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}