"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { showToast } from "@/lib/toast"
import { Package, Loader2 } from "lucide-react"

export function BusinessTypeInitializer() {
  const [loading, setLoading] = useState(false)

  const initializeBusinessTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/init-business-types', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        showToast.success(data.message)
        // Refresh the page to load the new business types
        window.location.reload()
      } else {
        showToast.error('Failed to initialize business types')
      }
    } catch (error) {
      showToast.error('Error initializing business types')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="text-center">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <CardTitle>Setup Required</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Initialize default business types to get started with your inventory system.
        </p>
        <Button onClick={initializeBusinessTypes} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              Initialize Business Types
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}