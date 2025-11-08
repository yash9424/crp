"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ChartDashboard } from "@/components/chart-dashboard"
import { AutoAlertSystem } from "@/lib/auto-alerts"

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
    // Start auto-alert system
    AutoAlertSystem.getInstance().start()
  }, [])

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Dashboard">
      <ChartDashboard />
    </MainLayout>
  )
}