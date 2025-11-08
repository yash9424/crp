import { useState, useEffect } from 'react'
import { FeatureKey } from '@/lib/feature-permissions'

export function useFeatureAccess() {
  const [allowedFeatures, setAllowedFeatures] = useState<FeatureKey[]>([
    'dashboard', 'inventory', 'pos', 'customers', 'purchases', 'hr', 'leaves', 'salary', 'bills', 'reports', 'expenses', 'dropdownSettings', 'settings'
  ])
  const [loading, setLoading] = useState(false)

  const hasFeature = (feature: FeatureKey): boolean => {
    return allowedFeatures.includes(feature)
  }

  return {
    allowedFeatures,
    hasFeature,
    loading
  }
}