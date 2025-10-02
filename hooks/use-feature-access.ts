import { useState, useEffect } from 'react'
import { FeatureKey } from '@/lib/feature-permissions'

export function useFeatureAccess() {
  const [allowedFeatures, setAllowedFeatures] = useState<FeatureKey[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeatures = async () => {
    try {
      console.log('Fetching tenant features...')
      const response = await fetch('/api/tenant-features')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Features data received:', data)
        setAllowedFeatures(data.allowedFeatures || [])
      } else {
        console.error('Failed to fetch features, status:', response.status)
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch features:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
    
    // Auto-refresh every 30 seconds to check for plan updates
    const interval = setInterval(fetchFeatures, 30000)
    return () => clearInterval(interval)
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