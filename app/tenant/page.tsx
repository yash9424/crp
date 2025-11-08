"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ChartDashboard } from "@/components/chart-dashboard"
import { AutoAlertSystem } from "@/lib/auto-alerts"
import { useLanguage } from "@/lib/language-context"

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    setLoading(false)
    // Start auto-alert system
    AutoAlertSystem.getInstance().start()
  }, [])

  if (loading) {
    return (
      <MainLayout title={t('dashboard')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('dashboard')}>
      <ChartDashboard />
    </MainLayout>
  )
}