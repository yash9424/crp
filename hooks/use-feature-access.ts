import { useState, useEffect } from 'react'
import { FeatureKey } from '@/lib/feature-permissions'

export function useFeatureAccess() {
  const [allowedFeatures, setAllowedFeatures] = useState<FeatureKey[]>(['dashboard'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/tenant-features')
        if (response.ok) {
          const data = await response.json()
          setAllowedFeatures(data.allowedFeatures || ['dashboard'])
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('API error:', response.status, errorData)
          setAllowedFeatures(['dashboard'])
        }
      } catch (error) {
        console.error('Failed to fetch features:', error)
        setAllowedFeatures(['dashboard'])
      } finally {
        setLoading(false)
      }
    }
    fetchFeatures()
  }, [])

  const hasFeature = (feature: FeatureKey): boolean => {
    return allowedFeatures.includes(feature)
  }

  return {
    allowedFeatures,
    hasFeature,
    loading
  }
}