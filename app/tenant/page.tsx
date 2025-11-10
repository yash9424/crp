"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ChartDashboard } from "@/components/chart-dashboard"
import { AutoAlertSystem } from "@/lib/auto-alerts"
import { useLanguage } from "@/lib/language-context"
import { TenantPlanNotification } from "@/components/tenant-plan-notification"

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    setLoading(false)
    console.log('📱 WhatsApp alerts scheduled via Vercel Cron at 11:30 AM daily')
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
      <TenantPlanNotification />
      <ChartDashboard />
    </MainLayout>
  )
}