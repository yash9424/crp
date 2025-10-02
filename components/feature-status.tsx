"use client"

import { useFeatureAccess } from '@/hooks/use-feature-access'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AVAILABLE_FEATURES } from '@/lib/feature-permissions'

export function FeatureStatus() {
  const { allowedFeatures, loading } = useFeatureAccess()

  if (loading) return null

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Active Features ({allowedFeatures.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {allowedFeatures.map(feature => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {AVAILABLE_FEATURES[feature]?.name || feature}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}